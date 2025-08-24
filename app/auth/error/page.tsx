"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

const errorMessages: Record<string, { title: string; description: string }> = {
  Configuration: {
    title: "Server Error",
    description:
      "There is a problem with the server configuration. Please try again later.",
  },
  AccessDenied: {
    title: "Access Denied",
    description:
      "You do not have permission to sign in. Please contact support if this is unexpected.",
  },
  Verification: {
    title: "Verification Error",
    description:
      "The verification token has expired or has already been used. Please try signing in again.",
  },
  Default: {
    title: "Authentication Error",
    description: "An error occurred during authentication. Please try again.",
  },
  CredentialsSignin: {
    title: "Invalid Credentials",
    description:
      "The email or password you entered is incorrect. Please check your credentials and try again.",
  },
  EmailSignin: {
    title: "Email Sign-in Error",
    description: "Unable to send email. Please try a different sign-in method.",
  },
  OAuthSignin: {
    title: "OAuth Sign-in Error",
    description:
      "Error occurred during OAuth sign-in. Please try again or use a different method.",
  },
  OAuthCallback: {
    title: "OAuth Callback Error",
    description:
      "Error occurred during OAuth callback. Please try signing in again.",
  },
  OAuthCreateAccount: {
    title: "OAuth Account Creation Error",
    description:
      "Could not create OAuth account. Please try again or contact support.",
  },
  EmailCreateAccount: {
    title: "Email Account Creation Error",
    description: "Could not create account with email. Please try again.",
  },
  Callback: {
    title: "Callback Error",
    description: "Error occurred during callback. Please try signing in again.",
  },
  OAuthAccountNotLinked: {
    title: "Account Not Linked",
    description:
      "This email is already associated with another account. Please sign in with your original method first, then link your accounts.",
  },
  SessionRequired: {
    title: "Session Required",
    description: "You must be signed in to access this page.",
  },
};

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error") || "Default";

  const errorInfo = errorMessages[error] || errorMessages.Default;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-blue-100">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-3xl">⚠️</span>
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-3">
              {errorInfo.title}
            </h1>
            <p className="text-gray-600 leading-relaxed">
              {errorInfo.description}
            </p>
            {error !== "Default" && (
              <p className="text-sm text-gray-500 mt-3">Error code: {error}</p>
            )}
          </div>

          <div className="space-y-3">
            <Link
              href="/auth/signin"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <span>🔑</span>
              Try Signing In Again
            </Link>

            <Link
              href="/auth/signup"
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <span>👤</span>
              Create New Account
            </Link>

            <Link
              href="/"
              className="w-full bg-white hover:bg-gray-50 text-gray-600 font-semibold py-3 px-4 rounded-xl border border-gray-300 transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <span>🏠</span>
              Go Home
            </Link>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-center text-sm text-gray-500">
              Still having trouble?{" "}
              <a
                href="mailto:support@cashlens.com"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Contact Support
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthError() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <AuthErrorContent />
    </Suspense>
  );
}
