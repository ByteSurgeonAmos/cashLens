import QRCode from "qrcode";
import CryptoJS from "crypto-js";
import { PrismaClient } from "@prisma/client";
import { randomBytes, createHmac } from "crypto";

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

// Generate a random 32-character base32 secret
export function generateTwoFactorSecret(): string {
  const randomBytesBuffer = randomBytes(20);
  const base32Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let secret = "";

  for (let i = 0; i < randomBytesBuffer.length; i++) {
    secret += base32Chars[randomBytesBuffer[i] % 32];
  }

  return secret;
}

export function generateQRCodeURL(
  email: string,
  secret: string,
  appName: string = "CashLens"
): string {
  const encodedEmail = encodeURIComponent(email);
  const encodedAppName = encodeURIComponent(appName);
  return `otpauth://totp/${encodedAppName}:${encodedEmail}?secret=${secret}&issuer=${encodedAppName}`;
}

export async function generateQRCodeDataURL(
  email: string,
  secret: string
): Promise<string> {
  const otpAuthUrl = generateQRCodeURL(email, secret);
  return await QRCode.toDataURL(otpAuthUrl);
}

// Base32 decoding function
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

// HOTP implementation
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

// TOTP implementation
function totp(secret: string, window: number = 30): number {
  const key = base32Decode(secret);
  const time = Math.floor(Date.now() / 1000 / window);
  return hotp(key, time);
}

export function verifyTOTP(token: string, secret: string): boolean {
  try {
    const tokenNumber = parseInt(token, 10);
    if (isNaN(tokenNumber)) return false;

    // Check current time window and ±1 window for clock drift
    for (let i = -1; i <= 1; i++) {
      const time = Math.floor(Date.now() / 1000 / 30) + i;
      const key = base32Decode(secret);
      const expectedToken = hotp(key, time);

      if (expectedToken === tokenNumber) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error("2FA verification error:", error);
    return false;
  }
}

export function generateBackupCodes(count: number = 8): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const code = randomBytes(4).toString("hex").toUpperCase();
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

    const codeIndex = user.backupCodes.indexOf(code.toUpperCase());
    if (codeIndex === -1) {
      return false;
    }

    // Remove the used backup code
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
    const hashedBackupCodes = backupCodes.map((code) => hashBackupCode(code));

    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
        twoFactorSecret: encryptedSecret,
        backupCodes: hashedBackupCodes,
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
    if (isBackupCode) {
      return await verifyBackupCode(userId, token);
    }

    // Get user's 2FA secret
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        twoFactorSecret: true,
        twoFactorEnabled: true,
      },
    });

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return false;
    }

    // Decrypt the secret and verify the TOTP
    const decryptedSecret = decryptSecret(user.twoFactorSecret);
    return verifyTOTP(token, decryptedSecret);
  } catch (error) {
    console.error("Error validating 2FA:", error);
    return false;
  }
}

function hashBackupCode(code: string): string {
  const crypto = require("crypto");
  return crypto.createHash("sha256").update(code).digest("hex");
}
