import { NextRequest, NextResponse } from "next/server";
import { validateTwoFactor } from "../../../../lib/auth/two-factor";
import { prisma } from "../../../../lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, token, isBackupCode = false } = body;

    if (!email || !token) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        twoFactorEnabled: true,
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
        { success: false, message: "2FA is not enabled for this user" },
        { status: 400 }
      );
    }

    const isValid = await validateTwoFactor(user.id, token, isBackupCode);

    if (!isValid) {
      return NextResponse.json(
        { success: false, message: "Invalid verification code" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "2FA verification successful",
      userId: user.id,
    });
  } catch (error) {
    console.error("2FA verification error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
