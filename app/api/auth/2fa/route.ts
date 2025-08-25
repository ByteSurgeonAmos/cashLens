import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth/auth-options";
import {
  generateTwoFactorSecret,
  generateQRCodeDataURL,
  generateBackupCodes,
  enableTwoFactor,
  verifyTOTP,
} from "../../../../lib/auth/two-factor";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET: Generate 2FA setup data (secret and QR code)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, email: true, twoFactorEnabled: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    if (user.twoFactorEnabled) {
      return NextResponse.json(
        { success: false, message: "2FA is already enabled" },
        { status: 400 }
      );
    }

    // Generate new secret and QR code
    const secret = generateTwoFactorSecret();
    const qrCodeDataURL = await generateQRCodeDataURL(user.email, secret);
    const backupCodes = generateBackupCodes();

    return NextResponse.json({
      success: true,
      data: {
        secret,
        qrCode: qrCodeDataURL,
        backupCodes,
      },
    });
  } catch (error) {
    console.error("2FA setup error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Enable 2FA with verification
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { secret, token, backupCodes } = body;

    if (!secret || !token || !backupCodes) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, twoFactorEnabled: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    if (user.twoFactorEnabled) {
      return NextResponse.json(
        { success: false, message: "2FA is already enabled" },
        { status: 400 }
      );
    }

    // Verify the TOTP token
    if (!verifyTOTP(token, secret)) {
      return NextResponse.json(
        { success: false, message: "Invalid verification code" },
        { status: 400 }
      );
    }

    // Enable 2FA for the user
    await enableTwoFactor(user.id, secret, backupCodes);

    return NextResponse.json({
      success: true,
      message: "2FA enabled successfully",
    });
  } catch (error) {
    console.error("2FA enable error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE: Disable 2FA
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
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

    if (!user.twoFactorEnabled) {
      return NextResponse.json(
        { success: false, message: "2FA is not enabled" },
        { status: 400 }
      );
    }

    // Verify password
    const bcrypt = require("bcryptjs");
    if (
      !user.hashedPassword ||
      !(await bcrypt.compare(password, user.hashedPassword))
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid password" },
        { status: 400 }
      );
    }

    // Verify 2FA token
    const { validateTwoFactor } = await import(
      "../../../../lib/auth/two-factor"
    );
    if (!(await validateTwoFactor(user.id, token))) {
      return NextResponse.json(
        { success: false, message: "Invalid 2FA code" },
        { status: 400 }
      );
    }

    // Disable 2FA
    const { disableTwoFactor } = await import(
      "../../../../lib/auth/two-factor"
    );
    await disableTwoFactor(user.id);

    return NextResponse.json({
      success: true,
      message: "2FA disabled successfully",
    });
  } catch (error) {
    console.error("2FA disable error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
