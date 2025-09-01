import { z } from "zod";
import DOMPurify from "isomorphic-dompurify";

// Input validation wrapper
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

// Input validation schemas
export const transactionSchema = z.object({
  amount: z.number().positive().max(999999.99, "Amount too large"),
  description: z.string().min(1).max(255).trim(),
  type: z.enum(["INCOME", "EXPENSE"]),
  categoryId: z.string().uuid(),
  date: z.string().datetime().optional(),
});

export const categorySchema = z.object({
  name: z.string().min(1).max(50).trim(),
  icon: z.string().min(1).max(10),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid color format"),
  type: z.enum(["INCOME", "EXPENSE"]),
});

export const budgetSchema = z.object({
  amount: z.number().positive().max(999999.99, "Amount too large"),
  categoryId: z.string().uuid(),
  period: z.enum(["WEEKLY", "MONTHLY", "YEARLY"]),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

export const userUpdateSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  currency: z.string().length(3).optional(),
  theme: z.enum(["light", "dark"]).optional(),
});

export const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password too long")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      "Password must contain uppercase, lowercase, number and special character"
    ),
});

// Sanitization functions
export function sanitizeHtml(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  });
}

export function sanitizeInput(input: any): any {
  if (typeof input === "string") {
    return sanitizeHtml(input.trim());
  }
  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }
  if (typeof input === "object" && input !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  return input;
}

// SQL injection prevention
export function validateSqlInput(input: string): boolean {
  const sqlInjectionPattern =
    /(('|(\\'))|(;|--|\/\*|\*\/|xp_|sp_|exec|execute|union|select|insert|update|delete|drop|create|alter|truncate))/gi;
  return !sqlInjectionPattern.test(input);
}

// XSS prevention
export function preventXSS(input: string): string {
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

// File upload validation
export const fileUploadSchema = z.object({
  filename: z.string().max(255),
  size: z.number().max(5 * 1024 * 1024), // 5MB max
  mimetype: z.enum(["image/jpeg", "image/png", "image/webp"]),
});

export function validateFileType(file: File): boolean {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  return allowedTypes.includes(file.type);
}

export function validateFileName(filename: string): boolean {
  // Prevent path traversal and dangerous filenames
  const dangerousPattern = /(\.\.|\/|\\|[<>:"|?*])/;
  return !dangerousPattern.test(filename) && filename.length <= 255;
}

// Data masking for logs
export function maskSensitiveData(data: any): any {
  const sensitiveFields = ["password", "token", "secret", "key", "email"];

  if (typeof data === "object" && data !== null) {
    const masked = { ...data };
    for (const [key, value] of Object.entries(masked)) {
      if (sensitiveFields.some((field) => key.toLowerCase().includes(field))) {
        masked[key] = "***MASKED***";
      } else if (typeof value === "object") {
        masked[key] = maskSensitiveData(value);
      }
    }
    return masked;
  }

  return data;
}
