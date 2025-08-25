"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

interface TwoFactorVerificationProps {
  email: string;
  onBack: () => void;
}

export default function TwoFactorVerification({
  email,
  onBack,
}: TwoFactorVerificationProps) {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [isBackupCode, setIsBackupCode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token.trim()) {
      setError("Please enter a verification code");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const verifyResponse = await fetch("/api/auth/verify-2fa", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          token: token.trim(),
          isBackupCode,
        }),
      });

      const verifyResult = await verifyResponse.json();

      if (!verifyResult.success) {
        setError(verifyResult.message || "Invalid verification code");
        return;
      }

      const signInResult = await signIn("credentials", {
        email,
        password: "__2FA_VERIFIED__",
        callbackUrl: "/dashboard",
        redirect: false,
      });

      if (signInResult?.error) {
        setError("Authentication failed. Please try again.");
      } else if (signInResult?.url) {
        router.push(signInResult.url);
      }
    } catch (error) {
      console.error("2FA verification error:", error);
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🔐</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Two-Factor Authentication
        </h2>
        <p className="text-gray-600">
          Enter the verification code from your authenticator app
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleVerify} className="space-y-6">
        <div>
          <label htmlFor="token" className="label">
            {isBackupCode ? "Backup Code" : "Verification Code"}
          </label>
          <input
            id="token"
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="input-field text-center text-lg tracking-widest"
            placeholder={isBackupCode ? "XXXXXXXX" : "000000"}
            maxLength={isBackupCode ? 8 : 6}
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Verifying...
            </div>
          ) : (
            "Verify"
          )}
        </button>

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setIsBackupCode(!isBackupCode)}
            className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {isBackupCode
              ? "Use authenticator app instead"
              : "Use backup code instead"}
          </button>

          <button
            type="button"
            onClick={onBack}
            className="w-full text-sm text-gray-600 hover:text-gray-700 font-medium"
          >
            ← Back to login
          </button>
        </div>
      </form>

      <div className="mt-6 pt-6 border-t border-gray-100">
        <p className="text-center text-xs text-gray-500">
          Can't access your authenticator app?{" "}
          <a
            href="mailto:support@cashlens.com"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Contact Support
          </a>
        </p>
      </div>
    </div>
  );
}
