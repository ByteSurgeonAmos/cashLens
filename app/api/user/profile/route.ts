import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { PrismaClient } from "@prisma/client";
import { authOptions } from "../../../../lib/auth/auth-options";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        twoFactorEnabled: true,
        hashedPassword: true,
        currency: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      twoFactorEnabled: user.twoFactorEnabled || false,
      hashedPassword: !!user.hashedPassword,
      currency: user.currency || "USD",
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, image, currency } = body;

    if (name && (typeof name !== "string" || name.trim().length === 0)) {
      return NextResponse.json(
        { success: false, message: "Name must be a non-empty string" },
        { status: 400 }
      );
    }

    if (currency && typeof currency !== "string") {
      return NextResponse.json(
        { success: false, message: "Currency must be a valid string" },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (image !== undefined) updateData.image = image;
    if (currency !== undefined) updateData.currency = currency;

    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        twoFactorEnabled: true,
        hashedPassword: true,
        currency: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        image: updatedUser.image,
        twoFactorEnabled: updatedUser.twoFactorEnabled || false,
        hashedPassword: !!updatedUser.hashedPassword,
        currency: updatedUser.currency || "USD",
      },
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
