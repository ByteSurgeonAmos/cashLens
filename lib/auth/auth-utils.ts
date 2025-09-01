import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../prisma";

export const registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)"
    ),
  name: z.string().min(3, "Name must be at least 3 characters").optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

export async function createUser(data: {
  email: string;
  password: string;
  name?: string;
}) {
  try {
    const validatedData = registerSchema.parse(data);

    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    const hashedPassword = await hashPassword(validatedData.password);

    const randomAvatar = generateRandomAvatar(validatedData.email);

    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        name: validatedData.name || validatedData.email.split("@")[0],
        hashedPassword: hashedPassword,
        image: randomAvatar,
      },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        createdAt: true,
      },
    });

    return user;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `Validation error: ${error.errors.map((e) => e.message).join(", ")}`
      );
    }
    throw error;
  }
}

export async function getUserByEmail(email: string) {
  return await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      hashedPassword: true,
      twoFactorEnabled: true,
    },
  });
}

const loginAttempts = new Map<string, { count: number; lastAttempt: Date }>();

export function checkRateLimit(email: string): boolean {
  const now = new Date();
  const attempt = loginAttempts.get(email);

  if (!attempt) {
    loginAttempts.set(email, { count: 1, lastAttempt: now });
    return true;
  }

  if (now.getTime() - attempt.lastAttempt.getTime() > 15 * 60 * 1000) {
    loginAttempts.set(email, { count: 1, lastAttempt: now });
    return true;
  }

  if (attempt.count >= 5) {
    return false;
  }

  attempt.count++;
  attempt.lastAttempt = now;
  return true;
}

export function resetRateLimit(email: string): void {
  loginAttempts.delete(email);
}

export async function createDefaultCategories(userId: string) {
  const defaultCategories = [
    { name: "Salary", icon: "💼", color: "#22c55e", type: "INCOME" as const },
    {
      name: "Freelance",
      icon: "💻",
      color: "#10b981",
      type: "INCOME" as const,
    },
    {
      name: "Investments",
      icon: "📈",
      color: "#059669",
      type: "INCOME" as const,
    },
    {
      name: "Other Income",
      icon: "💰",
      color: "#047857",
      type: "INCOME" as const,
    },

    {
      name: "Food & Dining",
      icon: "🍽️",
      color: "#ef4444",
      type: "EXPENSE" as const,
    },
    {
      name: "Transportation",
      icon: "🚗",
      color: "#f97316",
      type: "EXPENSE" as const,
    },
    {
      name: "Shopping",
      icon: "🛒",
      color: "#eab308",
      type: "EXPENSE" as const,
    },
    {
      name: "Entertainment",
      icon: "🎬",
      color: "#a855f7",
      type: "EXPENSE" as const,
    },
    {
      name: "Bills & Utilities",
      icon: "🏠",
      color: "#3b82f6",
      type: "EXPENSE" as const,
    },
    {
      name: "Healthcare",
      icon: "🏥",
      color: "#06b6d4",
      type: "EXPENSE" as const,
    },
    {
      name: "Education",
      icon: "📚",
      color: "#8b5cf6",
      type: "EXPENSE" as const,
    },
    {
      name: "Other Expenses",
      icon: "💸",
      color: "#dc2626",
      type: "EXPENSE" as const,
    },
  ];

  try {
    await prisma.category.createMany({
      data: defaultCategories.map((category) => ({
        ...category,
        userId,
      })),
    });
  } catch (error) {
    console.error("Error creating default categories:", error);
  }
}

export function generateRandomAvatar(email: string): string {
  const emailHash = email.split("").reduce((hash, char) => {
    return (hash << 5) - hash + char.charCodeAt(0);
  }, 0);

  const avatarServices = [
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
      email
    )}`,
    `https://api.dicebear.com/7.x/personas/svg?seed=${encodeURIComponent(
      email
    )}`,
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
      email
    )}`,
    `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${encodeURIComponent(
      email
    )}`,
  ];

  const serviceIndex = Math.abs(emailHash) % avatarServices.length;
  return avatarServices[serviceIndex];
}

export function isEmailPasswordUser(user: {
  hashedPassword?: string | null;
}): boolean {
  return !!user.hashedPassword;
}

export function canChangePassword(user: {
  hashedPassword?: string | null;
}): boolean {
  return isEmailPasswordUser(user);
}

export function canUse2FA(user: { hashedPassword?: string | null }): boolean {
  return isEmailPasswordUser(user);
}
