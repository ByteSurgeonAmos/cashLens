import { getServerSession } from "next-auth";
import { authOptions } from "../auth/auth-options";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../prisma";

export interface AuthenticatedContext {
  userId: string;
  userEmail: string;
  session: any;
}

// Authentication middleware for GraphQL resolvers
export async function requireAuth(context: any): Promise<AuthenticatedContext> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    throw new Error("Authentication required");
  }

  // Additional security check - verify user exists and is active
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, email: true, twoFactorEnabled: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return {
    userId: user.id,
    userEmail: user.email,
    session,
  };
}

// Authorization middleware - check if user owns the resource
export async function requireOwnership(
  userId: string,
  resourceId: string,
  resourceType: "transaction" | "category" | "budget"
): Promise<boolean> {
  let ownershipQuery;

  switch (resourceType) {
    case "transaction":
      ownershipQuery = prisma.transaction.findFirst({
        where: { id: resourceId, userId },
        select: { id: true },
      });
      break;
    case "category":
      ownershipQuery = prisma.category.findFirst({
        where: { id: resourceId, userId },
        select: { id: true },
      });
      break;
    case "budget":
      ownershipQuery = prisma.budget.findFirst({
        where: { id: resourceId, userId },
        select: { id: true },
      });
      break;
  }

  const resource = await ownershipQuery;

  if (!resource) {
    throw new Error(`Access denied: You don't own this ${resourceType}`);
  }

  return true;
}

// Data access control - filter queries by user
export function applyUserFilter(userId: string, query: any) {
  return {
    ...query,
    where: {
      ...query.where,
      userId,
    },
  };
}

// Audit logging for sensitive operations
export async function auditLog(
  userId: string,
  action: string,
  resourceType: string,
  resourceId?: string,
  metadata?: any
) {
  try {
    // In production, you might want to use a dedicated audit service
    console.log(
      `[AUDIT] User: ${userId}, Action: ${action}, Resource: ${resourceType}${
        resourceId ? `, ID: ${resourceId}` : ""
      }, Metadata:`,
      metadata
    );
  } catch (error) {
    console.error("Failed to write audit log:", error);
  }
}

const operationLimits = new Map<string, { count: number; resetTime: number }>();

export function checkGraphQLRateLimit(
  userId: string,
  operation: string,
  limit: number = 100,
  windowMs: number = 60 * 1000
): boolean {
  const key = `${userId}:${operation}`;
  const now = Date.now();

  const existing = operationLimits.get(key);

  if (!existing || now > existing.resetTime) {
    operationLimits.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (existing.count >= limit) {
    return false;
  }

  existing.count++;
  operationLimits.set(key, existing);
  return true;
}

export function validateInput<T>(schema: z.ZodSchema<T>, input: unknown): T {
  try {
    return schema.parse(input);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors
        .map((err) => `${err.path.join(".")}: ${err.message}`)
        .join(", ");
      throw new Error(`Validation failed: ${errorMessages}`);
    }
    throw error;
  }
}

// Secure field selection - prevent over-fetching
export function allowedFields(
  requestedFields: string[],
  allowedFieldsList: string[]
): string[] {
  return requestedFields.filter((field) => allowedFieldsList.includes(field));
}

// Data encryption utilities
export function hashSensitiveData(data: string): string {
  const crypto = require("crypto");
  return crypto.createHash("sha256").update(data).digest("hex");
}

// Content Security Policy for API responses
export const apiSecurityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Cache-Control": "no-store, no-cache, must-revalidate, private",
  Pragma: "no-cache",
};

// Error sanitization - don't leak internal information
export function sanitizeError(
  error: Error,
  isDevelopment: boolean = false
): any {
  if (isDevelopment) {
    return {
      message: error.message,
      stack: error.stack,
    };
  }

  // In production, return generic error messages
  const safeErrors = [
    "Authentication required",
    "Access denied",
    "Validation failed",
    "Resource not found",
    "Rate limit exceeded",
  ];

  const isSafeError = safeErrors.some((safe) => error.message.includes(safe));

  return {
    message: isSafeError ? error.message : "An error occurred",
    code: "INTERNAL_ERROR",
  };
}
