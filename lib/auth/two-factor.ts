import { authenticator } from "otplib";
import QRCode from "qrcode";
import CryptoJS from "crypto-js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ENCRYPTION_KEY =
  process.env.TWOFA_ENCRYPTION_KEY ||
  process.env.NEXTAUTH_SECRET ||
  "fallback-key";

export function encryptSecret(secret: string): string {
  return CryptoJS.AES.encrypt(secret, ENCRYPTION_KEY).toString();
}

export function decryptSecret(encryptedSecret: string): string {
  const bytes = CryptoJS.AES.decrypt(encryptedSecret, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}

export function generateTwoFactorSecret(): string {
  return authenticator.generateSecret();
}

export function generateQRCodeURL(
  email: string,
  secret: string,
  appName: string = "CashLens"
): string {
  return authenticator.keyuri(email, appName, secret);
}

export async function generateQRCodeDataURL(
  email: string,
  secret: string
): Promise<string> {
  const otpAuthUrl = generateQRCodeURL(email, secret);
  return await QRCode.toDataURL(otpAuthUrl);
}

export function verifyTOTP(token: string, secret: string): boolean {
  try {
    return authenticator.verify({ token, secret });
  } catch (error) {
    console.error("2FA verification error:", error);
    return false;
  }
}

export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    codes.push(code);
  }
  return codes;
}

export function hashBackupCodes(codes: string[]): string[] {
  return codes.map((code) => CryptoJS.SHA256(code).toString());
}

export function verifyBackupCode(
  inputCode: string,
  hashedCodes: string[]
): boolean {
  const hashedInput = CryptoJS.SHA256(inputCode.toUpperCase()).toString();
  return hashedCodes.includes(hashedInput);
}

export async function enableTwoFactor(
  userId: string,
  secret: string,
  backupCodes: string[]
) {
  const encryptedSecret = encryptSecret(secret);
  const hashedBackupCodes = hashBackupCodes(backupCodes);

  await prisma.user.update({
    where: { id: userId },
    data: {
      twoFactorSecret: encryptedSecret,
      twoFactorEnabled: true,
      backupCodes: hashedBackupCodes,
    },
  });
}

export async function disableTwoFactor(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      twoFactorSecret: null,
      twoFactorEnabled: false,
      backupCodes: [],
    },
  });
}

export async function getUserTwoFactorSettings(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      twoFactorEnabled: true,
      twoFactorSecret: true,
      backupCodes: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return {
    enabled: user.twoFactorEnabled,
    secret: user.twoFactorSecret ? decryptSecret(user.twoFactorSecret) : null,
    hasBackupCodes: user.backupCodes.length > 0,
  };
}

export async function useBackupCode(
  userId: string,
  inputCode: string
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { backupCodes: true },
  });

  if (!user) {
    return false;
  }

  const hashedInput = CryptoJS.SHA256(inputCode.toUpperCase()).toString();
  const codeIndex = user.backupCodes.indexOf(hashedInput);

  if (codeIndex === -1) {
    return false;
  }

  const updatedCodes = user.backupCodes.filter(
    (_, index) => index !== codeIndex
  );

  await prisma.user.update({
    where: { id: userId },
    data: { backupCodes: updatedCodes },
  });

  return true;
}

export async function validateTwoFactor(
  userId: string,
  token: string,
  isBackupCode: boolean = false
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      twoFactorEnabled: true,
      twoFactorSecret: true,
      backupCodes: true,
    },
  });

  if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
    return false;
  }

  if (isBackupCode) {
    return await useBackupCode(userId, token);
  } else {
    const secret = decryptSecret(user.twoFactorSecret);
    return verifyTOTP(token, secret);
  }
}
