import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import {
  createUser,
  createDefaultCategories,
} from "../../../../lib/auth/auth-utils";

const registrationAttempts = new Map<
  string,
  { count: number; lastAttempt: Date }
>();

function checkRegistrationRateLimit(ip: string): boolean {
  const now = new Date();
  const attempt = registrationAttempts.get(ip);

  if (!attempt) {
    registrationAttempts.set(ip, { count: 1, lastAttempt: now });
    return true;
  }

  if (now.getTime() - attempt.lastAttempt.getTime() > 60 * 60 * 1000) {
    registrationAttempts.set(ip, { count: 1, lastAttempt: now });
    return true;
  }

  if (attempt.count >= 3) {
    return false;
  }

  attempt.count++;
  attempt.lastAttempt = now;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const headersList = headers();
    const forwarded = headersList.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0] || "unknown";

    if (!checkRegistrationRateLimit(ip)) {
      return NextResponse.json(
        {
          success: false,
          message: "Too many registration attempts. Please try again later.",
        },
        { status: 429 }
      );
    }

    if (request.method !== "POST") {
      return NextResponse.json(
        { success: false, message: "Method not allowed" },
        { status: 405 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const { email, password, name } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email and password are required" },
        { status: 400 }
      );
    }

    const user = await createUser({ email, password, name });

    await createDefaultCategories(user.id);

    console.info(`New user registered: ${user.email} (ID: ${user.id})`);

    return NextResponse.json(
      {
        success: true,
        message:
          "Account created successfully! You can now sign in with your credentials.",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);

    if (error instanceof Error) {
      if (error.message.includes("already exists")) {
        return NextResponse.json(
          {
            success: false,
            message:
              "An account with this email already exists. Please sign in instead.",
          },
          { status: 409 }
        );
      }

      if (error.message.includes("Validation error")) {
        return NextResponse.json(
          {
            success: false,
            message: error.message.replace("Validation error: ", ""),
          },
          { status: 400 }
        );
      }

      if (
        error.message.includes("database") ||
        error.message.includes("connection")
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Connection error. Please try again later.",
          },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        message: "An unexpected error occurred. Please try again later.",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { message: "Registration endpoint. Use POST to create an account." },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json({ message: "Method not allowed" }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ message: "Method not allowed" }, { status: 405 });
}
