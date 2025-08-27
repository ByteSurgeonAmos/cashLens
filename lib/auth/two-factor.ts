import QRCode from "qrcode";
import speakeasy from "speakeasy";
import CryptoJS from "crypto-js";
import { PrismaClient } from "@prisma/client";
import { createHmac } from "crypto";

const prisma = new PrismaClient();

const ENCRYPTION_KEY =
  process.env.TWOFA_ENCRYPTION_KEY ||
  process.env.NEXTAUTH_SECRET ||
  "fallback-key";

export function encryptSecret(secret: string): string {
  return CryptoJS.AES.encrypt(secret, ENCRYPTION_KEY).toString();
}

export function decryptSecret(encryptedSecret: string): string {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedSecret, ENCRYPTION_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return decrypted;
  } catch (error) {
    console.error("Decryption error:", error);
    return "";
  }
}

export function generateTwoFactorSecret(): string {
  const bytes = new Uint8Array(20);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    const nodeCrypto = require("crypto");
    const buffer = nodeCrypto.randomBytes(20);
    for (let i = 0; i < 20; i++) {
      bytes[i] = buffer[i];
    }
  }

  const base32Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let result = "";
  let bits = 0;
  let value = 0;

  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i];
    bits += 8;

    while (bits >= 5) {
      result += base32Chars[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    result += base32Chars[(value << (5 - bits)) & 31];
  }

  return result;
}

export function generateQRCodeURL(
  email: string,
  secret: string,
  appName: string = "CashLens"
): string {
  return `otpauth://totp/${encodeURIComponent(appName)}:${encodeURIComponent(
    email
  )}?secret=${secret}&issuer=${encodeURIComponent(appName)}`;
}

export async function generateQRCodeDataURL(
  email: string,
  secret: string
): Promise<string> {
  try {
    const otpAuthUrl = generateQRCodeURL(email, secret);
    console.log("OTP Auth URL:", otpAuthUrl); // Debug log

    const qrCodeDataURL = await QRCode.toDataURL(otpAuthUrl, {
      errorCorrectionLevel: "M",
      width: 256,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });

    console.log(
      "QR Code generated successfully, length:",
      qrCodeDataURL.length
    );
    return qrCodeDataURL;
  } catch (error) {
    console.error("Error generating QR code:", error);
    throw new Error("Failed to generate QR code");
  }
}

function base32Decode(encoded: string): Buffer {
  const base32Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const padding = encoded.length % 8;
  if (padding) {
    encoded += "=".repeat(8 - padding);
  }

  let bits = "";
  for (let i = 0; i < encoded.length; i++) {
    const char = encoded[i];
    if (char === "=") break;
    const charIndex = base32Chars.indexOf(char.toUpperCase());
    if (charIndex === -1) throw new Error("Invalid base32 character");
    bits += charIndex.toString(2).padStart(5, "0");
  }

  const bytes = [];
  for (let i = 0; i < bits.length - 7; i += 8) {
    bytes.push(parseInt(bits.substr(i, 8), 2));
  }

  return Buffer.from(bytes);
}

function hotp(key: Buffer, counter: number): number {
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
  counterBuffer.writeUInt32BE(counter & 0xffffffff, 4);

  const hmac = createHmac("sha1", key);
  hmac.update(counterBuffer);
  const digest = hmac.digest();

  const offset = digest[digest.length - 1] & 0xf;
  const code =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);

  return code % 1000000;
}

function totp(secret: string, window: number = 30, timeStep?: number): number {
  const key = base32Decode(secret);
  const time =
    timeStep !== undefined ? timeStep : Math.floor(Date.now() / 1000 / window);
  return hotp(key, time);
}

export function verifyTOTP(token: string, secret: string): boolean {
  try {
    const inputToken = parseInt(token, 10);
    if (isNaN(inputToken)) {
      console.log("Invalid token format:", token);
      return false;
    }

    const currentTime = Math.floor(Date.now() / 1000 / 30);

    // Try a wider window to account for time drift
    for (let i = -2; i <= 2; i++) {
      const timeStep = currentTime + i;
      try {
        const expectedToken = totp(secret, 30, timeStep);

        if (expectedToken === inputToken) {
          console.log("TOTP verification successful at time step offset:", i);
          return true;
        }
      } catch (stepError) {
        console.error(
          `Error generating TOTP for time step ${timeStep}:`,
          stepError
        );
      }
    }

    console.log("TOTP verification failed - no matching tokens found");
    return false;
  } catch (error) {
    console.error("2FA verification error:", error);
    return false;
  }
}

export function generateBackupCodes(count: number = 8): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    codes.push(code);
  }
  return codes;
}

export async function verifyBackupCode(
  userId: string,
  code: string
): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { backupCodes: true },
    });

    if (!user || !user.backupCodes) {
      return false;
    }

    const codeIndex = user.backupCodes.findIndex(
      (storedCode) => storedCode.toUpperCase() === code.toUpperCase()
    );

    if (codeIndex === -1) {
      const hashedCode = hashBackupCode(code.toUpperCase());
      const hashedIndex = user.backupCodes.findIndex(
        (storedCode) => storedCode === hashedCode
      );

      if (hashedIndex === -1) {
        return false;
      }

      const updatedCodes = user.backupCodes.filter(
        (_, index) => index !== hashedIndex
      );
      await prisma.user.update({
        where: { id: userId },
        data: { backupCodes: updatedCodes },
      });

      return true;
    }

    const updatedCodes = user.backupCodes.filter(
      (_, index) => index !== codeIndex
    );
    await prisma.user.update({
      where: { id: userId },
      data: { backupCodes: updatedCodes },
    });

    return true;
  } catch (error) {
    console.error("Backup code verification error:", error);
    return false;
  }
}

export async function getUserTwoFactorStatus(
  userId: string
): Promise<{ enabled: boolean; hasBackupCodes: boolean }> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        twoFactorEnabled: true,
        twoFactorSecret: true,
        backupCodes: true,
      },
    });

    return {
      enabled: user?.twoFactorEnabled || false,
      hasBackupCodes: (user?.backupCodes?.length || 0) > 0,
    };
  } catch (error) {
    console.error("Error getting 2FA status:", error);
    return { enabled: false, hasBackupCodes: false };
  }
}

export async function disableTwoFactor(userId: string): Promise<void> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        backupCodes: [],
      },
    });
  } catch (error) {
    console.error("Error disabling 2FA:", error);
    throw error;
  }
}

export async function enableTwoFactor(
  userId: string,
  secret: string,
  backupCodes: string[]
): Promise<void> {
  try {
    const encryptedSecret = encryptSecret(secret);
    const normalizedBackupCodes = backupCodes.map((code) => code.toUpperCase());

    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
        twoFactorSecret: encryptedSecret,
        backupCodes: normalizedBackupCodes,
      },
    });
  } catch (error) {
    console.error("Error enabling 2FA:", error);
    throw error;
  }
}

export async function validateTwoFactor(
  userId: string,
  token: string,
  isBackupCode: boolean = false
): Promise<boolean> {
  try {
    console.log("validateTwoFactor called with:", {
      userId,
      token,
      isBackupCode,
    });

    if (isBackupCode) {
      return await verifyBackupCode(userId, token);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        twoFactorSecret: true,
        twoFactorEnabled: true,
      },
    });

    console.log("User 2FA status:", {
      hasUser: !!user,
      twoFactorEnabled: user?.twoFactorEnabled,
      hasSecret: !!user?.twoFactorSecret,
    });

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      console.log(
        "User validation failed - missing user, 2FA not enabled, or no secret"
      );
      return false;
    }

    const decryptedSecret = decryptSecret(user.twoFactorSecret);
    console.log("Decrypted secret length:", decryptedSecret.length);

    const result = verifyTOTP(token, decryptedSecret);
    console.log("TOTP verification result:", result);

    return result;
  } catch (error) {
    console.error("Error validating 2FA:", error);
    return false;
  }
}

function hashBackupCode(code: string): string {
  const crypto = require("crypto");
  return crypto.createHash("sha256").update(code).digest("hex");
}
