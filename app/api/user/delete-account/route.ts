import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../lib/auth/auth-options";
import { PrismaClient } from "@prisma/client";
import { prisma } from "../../../../lib/prisma";

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const userEmail = session.user.email;

    await prisma.$transaction(async (tx) => {
      await tx.transaction.deleteMany({
        where: {
          user: {
            email: userEmail,
          },
        },
      });

      await tx.budget.deleteMany({
        where: {
          user: {
            email: userEmail,
          },
        },
      });

      await tx.category.deleteMany({
        where: {
          user: {
            email: userEmail,
          },
        },
      });

      await tx.user.delete({
        where: {
          email: userEmail,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("Delete account error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete account" },
      { status: 500 }
    );
  }
}
