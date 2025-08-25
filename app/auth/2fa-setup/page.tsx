"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function TwoFactorSetupPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [step, setStep] = useState(1); // 1: Generate, 2: Verify, 3: Backup codes
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showCodes, setShowCodes] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  const generateSetup = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/2fa", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (result.success) {
        setQrCode(result.data.qrCode);
        setSecret(result.data.secret);
        setBackupCodes(result.data.backupCodes);
        setStep(2);
      } else {
        setError(result.message || "Failed to generate 2FA setup");
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const verifySetup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!verificationCode.trim()) {
      setError("Please enter a verification code");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/2fa", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          secret,
          token: verificationCode.trim(),
          backupCodes,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setStep(3);
      } else {
        setError(result.message || "Invalid verification code");
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const downloadBackupCodes = () => {
    const codesText = backupCodes.join("\n");
    const blob = new Blob([codesText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cashlens-backup-codes.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🔐</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Enable Two-Factor Authentication
            </h1>
            <p className="text-gray-600">
              Add an extra layer of security to your account
            </p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Step 1: Introduction */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">
                  Get Started
                </h2>
                <p className="text-gray-600 mb-6">
                  You'll need an authenticator app like Google Authenticator,
                  Authy, or similar to scan the QR code.
                </p>
              </div>

              <button
                onClick={generateSetup}
                disabled={isLoading}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Generating...
                  </div>
                ) : (
                  "Generate QR Code"
                )}
              </button>
            </div>
          )}

          {/* Step 2: Scan QR Code and Verify */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">
                  Scan QR Code
                </h2>
                <p className="text-gray-600 mb-4">
                  Scan this QR code with your authenticator app
                </p>

                {qrCode && (
                  <div className="bg-white p-4 rounded-lg border mb-4">
                    <img
                      src={qrCode}
                      alt="2FA QR Code"
                      className="mx-auto"
                      width={200}
                      height={200}
                    />
                  </div>
                )}

                <p className="text-xs text-gray-500 mb-6">
                  Can't scan? Manual entry key: <br />
                  <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                    {secret}
                  </code>
                </p>
              </div>

              <form onSubmit={verifySetup} className="space-y-4">
                <div>
                  <label htmlFor="code" className="label">
                    Enter verification code
                  </label>
                  <input
                    id="code"
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    className="input-field text-center text-lg tracking-widest"
                    placeholder="000000"
                    maxLength={6}
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
                    "Verify & Enable 2FA"
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Step 3: Backup Codes */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl">✅</span>
                </div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">
                  2FA Enabled Successfully!
                </h2>
                <p className="text-gray-600 mb-6">
                  Save these backup codes in a safe place. You can use them to
                  access your account if you lose your authenticator device.
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium text-gray-900">Backup Codes</h3>
                  <button
                    onClick={() => setShowCodes(!showCodes)}
                    className="text-blue-600 hover:text-blue-700 text-sm"
                  >
                    {showCodes ? "Hide" : "Show"}
                  </button>
                </div>

                {showCodes && (
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {backupCodes.map((code, index) => (
                      <code
                        key={index}
                        className="bg-white px-3 py-2 rounded text-sm font-mono"
                      >
                        {code}
                      </code>
                    ))}
                  </div>
                )}

                <button
                  onClick={downloadBackupCodes}
                  className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  📁 Download Backup Codes
                </button>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => router.push("/dashboard")}
                  className="w-full btn-primary"
                >
                  Continue to Dashboard
                </button>

                <button
                  onClick={() => router.push("/settings/security")}
                  className="w-full text-sm text-gray-600 hover:text-gray-700 font-medium"
                >
                  Go to Security Settings
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
