import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../lib/auth/auth-options";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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

    // Start a transaction to delete all user data
    await prisma.$transaction(async (tx) => {
      // Delete all user transactions first (due to foreign key constraints)
      await tx.transaction.deleteMany({
        where: {
          user: {
            email: userEmail,
          },
        },
      });

      // Delete all user budgets
      await tx.budget.deleteMany({
        where: {
          user: {
            email: userEmail,
          },
        },
      });

      // Delete all user categories
      await tx.category.deleteMany({
        where: {
          user: {
            email: userEmail,
          },
        },
      });

      // Finally, delete the user account
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
