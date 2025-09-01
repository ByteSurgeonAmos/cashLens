import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { rateLimit } from "./lib/security/rate-limit";

const securityHeaders = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://fonts.googleapis.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://api.github.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; "),
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
  "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
};

const protectedRoutes = [
  "/dashboard",
  "/transactions",
  "/budgets",
  "/categories",
  "/reports",
  "/settings",
  "/api/graphql",
  "/api/user",
];

const rateLimitedRoutes = ["/api/auth", "/api/graphql", "/api/user"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const response = NextResponse.next();

  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  if (rateLimitedRoutes.some((route) => pathname.startsWith(route))) {
    const ip =
      request.ip || request.headers.get("x-forwarded-for") || "unknown";
    const rateLimitResult = await rateLimit(ip, pathname);

    if (!rateLimitResult.success) {
      return new NextResponse(
        JSON.stringify({
          error: "Too many requests",
          message: "Rate limit exceeded. Please try again later.",
          retryAfter: rateLimitResult.retryAfter,
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": rateLimitResult.retryAfter?.toString() || "60",
            ...securityHeaders,
          },
        }
      );
    }
  }

  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      const signInUrl = new URL("/auth/signin", request.url);
      signInUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signInUrl);
    }

    if (token.locked || token.suspicious) {
      const errorUrl = new URL("/auth/error", request.url);
      errorUrl.searchParams.set("error", "AccountLocked");
      return NextResponse.redirect(errorUrl);
    }
  }

  if (pathname.startsWith("/api/user/delete-account")) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    if (!token || !token.twoFactorVerified) {
      return new NextResponse(
        JSON.stringify({ error: "Two-factor authentication required" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json", ...securityHeaders },
        }
      );
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public/).*)"],
};
