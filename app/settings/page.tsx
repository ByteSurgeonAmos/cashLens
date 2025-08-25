"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Layout } from "../../components/layout/Layout";
import { generateRandomAvatar } from "../../lib/auth/auth-utils";

interface UserProfile {
  name: string;
  email: string;
  image: string;
  twoFactorEnabled: boolean;
  hashedPassword: boolean;
}

const CURRENCIES = [
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$" },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
  { code: "INR", name: "Indian Rupee", symbol: "₹" },
  { code: "KES", name: "Kenyan Shillings", symbol: "KES" },
];

export default function SettingsPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [profile, setProfile] = useState<UserProfile>({
    name: "",
    email: "",
    image: "",
    twoFactorEnabled: false,
    hashedPassword: false,
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [tempProfile, setTempProfile] = useState<UserProfile>({
    name: "",
    email: "",
    image: "",
    twoFactorEnabled: false,
    hashedPassword: false,
  });

  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  const [show2FASetup, setShow2FASetup] = useState(false);
  const [twoFAData, setTwoFAData] = useState({
    secret: "",
    qrCode: "",
    verificationCode: "",
    backupCodes: [] as string[],
    showBackupCodes: false,
  });

  const [currency, setCurrency] = useState("USD");
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    } else if (session?.user) {
      const userProfile = {
        name: session.user.name || "",
        email: session.user.email || "",
        image: session.user.image || "",
        twoFactorEnabled: false,
        hashedPassword: false,
      };
      setProfile(userProfile);
      setTempProfile(userProfile);
      fetchUserProfile();
    }

    const savedCurrency = localStorage.getItem("cashLens_currency");
    const savedTheme = localStorage.getItem("cashLens_theme");
    if (savedCurrency) setCurrency(savedCurrency);
    if (savedTheme) setTheme(savedTheme);
  }, [session, status, router]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch("/api/user/profile");
      const result = await response.json();

      if (response.ok) {
        setProfile({
          name: result.name || "",
          email: result.email || "",
          image: result.image || "",
          twoFactorEnabled: result.twoFactorEnabled || false,
          hashedPassword: result.hashedPassword || false,
        });
        setTempProfile({
          name: result.name || "",
          email: result.email || "",
          image: result.image || "",
          twoFactorEnabled: result.twoFactorEnabled || false,
          hashedPassword: result.hashedPassword || false,
        });
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  const generateNewAvatar = () => {
    if (profile.email) {
      const newAvatar = generateRandomAvatar(
        profile.email + Date.now().toString()
      );
      setTempProfile({ ...tempProfile, image: newAvatar });
    }
  };

  const handleSaveProfile = async () => {
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: tempProfile.name,
          image: tempProfile.image,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setProfile(tempProfile);
        setIsEditingProfile(false);
        setSuccess("Profile updated successfully!");
        await update({
          name: tempProfile.name,
          image: tempProfile.image,
        });
      } else {
        setError(result.message || "Failed to update profile");
      }
    } catch (error) {
      setError("An error occurred while updating profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setTempProfile(profile);
    setIsEditingProfile(false);
    setError("");
    setSuccess("");
  };

  const validatePassword = (password: string): string[] => {
    const errors = [];
    if (password.length < 8)
      errors.push("Password must be at least 8 characters");
    if (!/[a-z]/.test(password))
      errors.push("Password must contain a lowercase letter");
    if (!/[A-Z]/.test(password))
      errors.push("Password must contain an uppercase letter");
    if (!/\d/.test(password)) errors.push("Password must contain a number");
    if (!/[@$!%*?&]/.test(password))
      errors.push("Password must contain a special character");
    return errors;
  };

  const handlePasswordChange = async () => {
    setError("");
    setSuccess("");
    setPasswordErrors([]);

    const newPasswordErrors = validatePassword(passwordData.newPassword);
    if (newPasswordErrors.length > 0) {
      setPasswordErrors(newPasswordErrors);
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    if (!passwordData.currentPassword) {
      setError("Current password is required");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/user/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess("Password changed successfully!");
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setShowPasswordChange(false);
      } else {
        setError(result.message || "Failed to change password");
      }
    } catch (error) {
      setError("An error occurred while changing password");
    } finally {
      setIsLoading(false);
    }
  };

  const handle2FASetup = async () => {
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/user/2fa-manage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "setup" }),
      });

      const result = await response.json();

      if (result.success) {
        setTwoFAData({
          ...twoFAData,
          secret: result.secret,
          qrCode: result.qrCode,
        });
        setShow2FASetup(true);
      } else {
        setError(result.message || "Failed to setup 2FA");
      }
    } catch (error) {
      setError("An error occurred while setting up 2FA");
    } finally {
      setIsLoading(false);
    }
  };

  const handle2FAVerification = async () => {
    if (!twoFAData.verificationCode) {
      setError("Please enter the verification code");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/user/2fa-manage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "verify",
          token: twoFAData.verificationCode,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setTwoFAData({
          ...twoFAData,
          backupCodes: result.backupCodes,
          showBackupCodes: true,
        });
        setProfile({ ...profile, twoFactorEnabled: true });
        setSuccess("2FA enabled successfully! Please save your backup codes.");
      } else {
        setError(result.message || "Failed to verify 2FA");
      }
    } catch (error) {
      setError("An error occurred while verifying 2FA");
    } finally {
      setIsLoading(false);
    }
  };

  const handle2FADisable = async () => {
    const password = prompt("Enter your password to disable 2FA:");
    if (!password) return;

    setIsLoading(true);

    try {
      const response = await fetch("/api/user/2fa-manage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "disable",
          password: password,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setProfile({ ...profile, twoFactorEnabled: false });
        setSuccess("2FA disabled successfully!");
      } else {
        setError(result.message || "Failed to disable 2FA");
      }
    } catch (error) {
      setError("An error occurred while disabling 2FA");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCurrencyChange = (newCurrency: string) => {
    setCurrency(newCurrency);
    localStorage.setItem("cashLens_currency", newCurrency);
    setSuccess(`Currency changed to ${newCurrency}`);
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem("cashLens_theme", newTheme);
    setSuccess(`Theme changed to ${newTheme}`);
  };

  if (status === "loading") {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Manage your account settings and preferences
          </p>
        </div>

        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
            <p className="text-green-600 dark:text-green-400 text-sm">
              {success}
            </p>
          </div>
        )}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Profile Information
          </h2>

          <div className="space-y-6">
            <div className="flex items-center space-x-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200">
                  {(isEditingProfile ? tempProfile.image : profile.image) ? (
                    <Image
                      src={isEditingProfile ? tempProfile.image : profile.image}
                      alt="Profile"
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl">
                      👤
                    </div>
                  )}
                </div>
              </div>

              {isEditingProfile && (
                <div className="flex flex-col space-y-2">
                  <button
                    type="button"
                    onClick={generateNewAvatar}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    Generate New Avatar
                  </button>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Click to get a new random avatar
                  </p>
                </div>
              )}
            </div>

            {/* Name Field */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Full Name
              </label>
              {isEditingProfile ? (
                <input
                  id="name"
                  type="text"
                  value={tempProfile.name}
                  onChange={(e) =>
                    setTempProfile({ ...tempProfile, name: e.target.value })
                  }
                  className="input-field max-w-md"
                  placeholder="Enter your full name"
                />
              ) : (
                <p className="text-gray-900 dark:text-white py-2">
                  {profile.name}
                </p>
              )}
            </div>

            {/* Email Field (Read-only) */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Email Address
              </label>
              <p className="text-gray-900 dark:text-white py-2">
                {profile.email}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Email cannot be changed
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4 pt-4">
              {isEditingProfile ? (
                <>
                  <button
                    onClick={handleSaveProfile}
                    disabled={isLoading}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditingProfile(true)}
                  className="btn-primary"
                >
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Preferences
          </h2>

          <div className="space-y-6">
            {/* Currency Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Default Currency
              </label>
              <select
                value={currency}
                onChange={(e) => handleCurrencyChange(e.target.value)}
                className="input-field max-w-xs"
              >
                {CURRENCIES.map((curr) => (
                  <option key={curr.code} value={curr.code}>
                    {curr.code} - {curr.name} ({curr.symbol})
                  </option>
                ))}
              </select>
            </div>

            {/* Theme Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Theme
              </label>
              <div className="flex space-x-4">
                <button
                  onClick={() => handleThemeChange("light")}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    theme === "light"
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
                  }`}
                >
                  ☀️ Light
                </button>
                <button
                  onClick={() => handleThemeChange("dark")}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    theme === "dark"
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
                  }`}
                >
                  🌙 Dark
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Security Settings - Only show for email/password users */}
        {profile.hashedPassword && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Security
            </h2>

            <div className="space-y-6">
              {/* Two-Factor Authentication */}
              <div className="flex items-center justify-between py-4 border-b border-gray-100 dark:border-gray-600">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                    Two-Factor Authentication
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Add an extra layer of security to your account
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      profile.twoFactorEnabled
                        ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {profile.twoFactorEnabled ? "Enabled" : "Disabled"}
                  </span>
                  <button
                    onClick={
                      profile.twoFactorEnabled
                        ? handle2FADisable
                        : handle2FASetup
                    }
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
                    disabled={isLoading}
                  >
                    {profile.twoFactorEnabled ? "Disable" : "Setup"}
                  </button>
                </div>
              </div>

              {/* Change Password */}
              <div className="flex items-center justify-between py-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                    Password
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Change your account password
                  </p>
                </div>
                <button
                  onClick={() => setShowPasswordChange(true)}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
                >
                  Change Password
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Password Change Modal */}
        {showPasswordChange && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Change Password
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        currentPassword: e.target.value,
                      })
                    }
                    className="input-field w-full"
                    placeholder="Enter current password"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        newPassword: e.target.value,
                      })
                    }
                    className="input-field w-full"
                    placeholder="Enter new password"
                  />
                  {passwordErrors.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {passwordErrors.map((error, index) => (
                        <p
                          key={index}
                          className="text-xs text-red-600 dark:text-red-400"
                        >
                          • {error}
                        </p>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        confirmPassword: e.target.value,
                      })
                    }
                    className="input-field w-full"
                    placeholder="Confirm new password"
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={handlePasswordChange}
                  disabled={isLoading}
                  className="btn-primary flex-1 disabled:opacity-50"
                >
                  {isLoading ? "Changing..." : "Change Password"}
                </button>
                <button
                  onClick={() => {
                    setShowPasswordChange(false);
                    setPasswordData({
                      currentPassword: "",
                      newPassword: "",
                      confirmPassword: "",
                    });
                    setPasswordErrors([]);
                  }}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2FA Setup Modal */}
        {show2FASetup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Setup Two-Factor Authentication
              </h3>

              {!twoFAData.showBackupCodes ? (
                <div className="space-y-4">
                  {twoFAData.qrCode && (
                    <div className="text-center">
                      <div className="inline-block p-4 bg-white rounded-lg">
                        <img
                          src={twoFAData.qrCode}
                          alt="2FA QR Code"
                          className="w-48 h-48 mx-auto"
                        />
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        Scan this QR code with your authenticator app
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Verification Code
                    </label>
                    <input
                      type="text"
                      value={twoFAData.verificationCode}
                      onChange={(e) =>
                        setTwoFAData({
                          ...twoFAData,
                          verificationCode: e.target.value,
                        })
                      }
                      className="input-field w-full text-center text-lg tracking-wider"
                      placeholder="000000"
                      maxLength={6}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Enter the 6-digit code from your authenticator app
                    </p>
                  </div>

                  <div className="flex space-x-3 mt-6">
                    <button
                      onClick={handle2FAVerification}
                      disabled={isLoading}
                      className="btn-primary flex-1 disabled:opacity-50"
                    >
                      {isLoading ? "Verifying..." : "Verify & Enable"}
                    </button>
                    <button
                      onClick={() => {
                        setShow2FASetup(false);
                        setTwoFAData({
                          secret: "",
                          qrCode: "",
                          verificationCode: "",
                          backupCodes: [],
                          showBackupCodes: false,
                        });
                      }}
                      className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg
                        className="w-6 h-6 text-green-600 dark:text-green-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                      2FA Enabled Successfully!
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Please save these backup codes in a secure location
                    </p>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h5 className="font-medium text-gray-900 dark:text-white mb-2">
                      Backup Codes
                    </h5>
                    <div className="grid grid-cols-2 gap-2 text-sm font-mono">
                      {twoFAData.backupCodes.map((code, index) => (
                        <div
                          key={index}
                          className="bg-white dark:bg-gray-600 p-2 rounded text-center"
                        >
                          {code}
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Each backup code can only be used once. Store them safely!
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setShow2FASetup(false);
                      setTwoFAData({
                        secret: "",
                        qrCode: "",
                        verificationCode: "",
                        backupCodes: [],
                        showBackupCodes: false,
                      });
                    }}
                    className="btn-primary w-full"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Account Type Info - Show for OAuth users */}
        {!profile.hashedPassword && (
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl shadow-sm border border-blue-100 dark:border-blue-700 p-6">
            <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-300 mb-4">
              Account Security
            </h2>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 text-blue-600 dark:text-blue-400 mt-0.5">
                🔒
              </div>
              <div>
                <h3 className="text-sm font-medium text-blue-900 dark:text-blue-300">
                  OAuth Account
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                  Your account is secured through your OAuth provider (Google,
                  etc.). Security settings like password changes and two-factor
                  authentication are managed through your OAuth provider's
                  security settings.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Account Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Account Actions
          </h2>

          <div className="space-y-4">
            <button className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors border border-red-200 dark:border-red-800">
              <div>
                <div className="font-medium">Delete Account</div>
                <div className="text-sm text-red-500 dark:text-red-400 mt-1">
                  Permanently delete your account and all data
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
