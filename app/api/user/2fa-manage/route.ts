import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { PrismaClient } from "@prisma/client";
import { authOptions } from "../../../../lib/auth/auth-options";
import {
  generateTwoFactorSecret,
  generateQRCodeDataURL,
  verifyTOTP,
  generateBackupCodes,
  disableTwoFactor,
  encryptSecret,
  decryptSecret,
} from "../../../../lib/auth/two-factor";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action } = body;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        name: true,
        hashedPassword: true,
        twoFactorEnabled: true,
        twoFactorSecret: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    if (!user.hashedPassword) {
      return NextResponse.json(
        {
          success: false,
          message: "2FA is only available for email/password accounts",
        },
        { status: 400 }
      );
    }

    if (action === "setup") {
      if (user.twoFactorEnabled) {
        return NextResponse.json(
          { success: false, message: "2FA is already enabled" },
          { status: 400 }
        );
      }

      const secret = generateTwoFactorSecret();
      const serviceName = "CashLens";
      const accountName = user.email;
      const qrCode = await generateQRCodeDataURL(accountName, secret);

      // Store encrypted secret temporarily for setup
      const encryptedSecret = encryptSecret(secret);
      await prisma.user.update({
        where: { id: user.id },
        data: { twoFactorSecret: encryptedSecret },
      });

      return NextResponse.json({
        success: true,
        secret,
        qrCode,
        message: "Scan the QR code with your authenticator app",
      });
    } else if (action === "verify") {
      const { token } = body;

      if (!token) {
        return NextResponse.json(
          { success: false, message: "Verification token is required" },
          { status: 400 }
        );
      }

      if (!user.twoFactorSecret) {
        return NextResponse.json(
          { success: false, message: "2FA setup not initiated" },
          { status: 400 }
        );
      }

      // Decrypt the secret for verification
      const decryptedSecret = decryptSecret(user.twoFactorSecret);
      if (!decryptedSecret) {
        return NextResponse.json(
          {
            success: false,
            message: "2FA setup corrupted, please restart setup",
          },
          { status: 400 }
        );
      }

      const isValid = verifyTOTP(token, decryptedSecret);
      if (!isValid) {
        return NextResponse.json(
          { success: false, message: "Invalid verification code" },
          { status: 400 }
        );
      }

      const backupCodes = generateBackupCodes();

      await prisma.user.update({
        where: { id: user.id },
        data: {
          twoFactorEnabled: true,
          backupCodes: backupCodes,
        },
      });

      return NextResponse.json({
        success: true,
        message: "2FA enabled successfully",
        backupCodes,
      });
    } else if (action === "disable") {
      const { password } = body;

      if (!password) {
        return NextResponse.json(
          { success: false, message: "Password is required to disable 2FA" },
          { status: 400 }
        );
      }

      if (!user.twoFactorEnabled) {
        return NextResponse.json(
          { success: false, message: "2FA is not enabled" },
          { status: 400 }
        );
      }

      const { verifyPassword } = await import(
        "../../../../lib/auth/auth-utils"
      );
      const isPasswordValid = await verifyPassword(
        password,
        user.hashedPassword!
      );
      if (!isPasswordValid) {
        return NextResponse.json(
          { success: false, message: "Incorrect password" },
          { status: 400 }
        );
      }

      await disableTwoFactor(user.id);

      return NextResponse.json({
        success: true,
        message: "2FA disabled successfully",
      });
    } else {
      return NextResponse.json(
        { success: false, message: "Invalid action" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error managing 2FA:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
