"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Layout } from "../../components/layout/Layout";
import { ConfirmationModal } from "../../components/ui/ConfirmationModal";
import { ImageUpload } from "../../components/ui/ImageUpload";
import { generateRandomAvatar } from "../../lib/auth/auth-utils";
import { useCurrency } from "../../contexts/CurrencyContext";

interface UserProfile {
  name: string;
  email: string;
  image: string;
  twoFactorEnabled: boolean;
  hashedPassword: boolean;
}

export default function SettingsPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const { currency, setCurrency, currencies } = useCurrency();
  const [isLoading, setIsLoading] = useState(false);
  const [globalError, setGlobalError] = useState("");
  const [globalSuccess, setGlobalSuccess] = useState("");
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

  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [securityError, setSecurityError] = useState("");
  const [securitySuccess, setSecuritySuccess] = useState("");
  const [currencyError, setCurrencyError] = useState("");
  const [currencySuccess, setCurrencySuccess] = useState("");
  const [themeSuccess, setThemeSuccess] = useState("");

  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  const [show2FASetup, setShow2FASetup] = useState(false);
  const [show2FADisable, setShow2FADisable] = useState(false);
  const [disablePassword, setDisablePassword] = useState("");
  const [twoFAData, setTwoFAData] = useState({
    secret: "",
    qrCode: "",
    verificationCode: "",
    backupCodes: [] as string[],
    showBackupCodes: false,
  });

  const [theme, setTheme] = useState("light");
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");

  const [imageUploadLoading, setImageUploadLoading] = useState(false);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);

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

    const savedTheme = localStorage.getItem("cashLens_theme");
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

  const handleImageSelect = async (file: File) => {
    setImageUploadLoading(true);
    setProfileError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/user/upload-image", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setTempProfile({ ...tempProfile, image: result.imageUrl });
        setPendingImageFile(file);
      } else {
        setProfileError(result.error || "Failed to upload image");
      }
    } catch (error) {
      setProfileError("An error occurred while uploading the image");
    } finally {
      setImageUploadLoading(false);
    }
  };

  const handleImageRemove = () => {
    setTempProfile({ ...tempProfile, image: "" });
    setPendingImageFile(null);
  };

  const handleSaveProfile = async () => {
    setIsLoading(true);
    setProfileError("");
    setProfileSuccess("");

    try {
      if (
        profile.image &&
        profile.image.startsWith("/uploads/profiles/") &&
        profile.image !== tempProfile.image
      ) {
        try {
          await fetch(
            `/api/user/upload-image?imageUrl=${encodeURIComponent(
              profile.image
            )}`,
            {
              method: "DELETE",
            }
          );
        } catch (deleteError) {
          console.warn("Could not delete previous image:", deleteError);
        }
      }

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
        setProfileSuccess("Profile updated successfully!");
        setPendingImageFile(null);
        await update({
          name: tempProfile.name,
          image: tempProfile.image,
        });
      } else {
        setProfileError(result.message || "Failed to update profile");
      }
    } catch (error) {
      setProfileError("An error occurred while updating profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = async () => {
    if (
      pendingImageFile &&
      tempProfile.image &&
      tempProfile.image.startsWith("/uploads/profiles/") &&
      tempProfile.image !== profile.image
    ) {
      try {
        await fetch(
          `/api/user/upload-image?imageUrl=${encodeURIComponent(
            tempProfile.image
          )}`,
          {
            method: "DELETE",
          }
        );
      } catch (deleteError) {
        console.warn("Could not delete pending image:", deleteError);
      }
    }

    setTempProfile(profile);
    setIsEditingProfile(false);
    setProfileError("");
    setProfileSuccess("");
    setPendingImageFile(null);
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
    setSecurityError("");
    setSecuritySuccess("");
    setPasswordErrors([]);

    const newPasswordErrors = validatePassword(passwordData.newPassword);
    if (newPasswordErrors.length > 0) {
      setPasswordErrors(newPasswordErrors);
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setSecurityError("New passwords do not match");
      return;
    }

    if (!passwordData.currentPassword) {
      setSecurityError("Current password is required");
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
        setSecuritySuccess("Password changed successfully!");
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setShowPasswordChange(false);
      } else {
        setSecurityError(result.message || "Failed to change password");
      }
    } catch (error) {
      setSecurityError("An error occurred while changing password");
    } finally {
      setIsLoading(false);
    }
  };

  const handle2FASetup = async () => {
    setSecurityError("");
    setSecuritySuccess("");
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
        console.log(
          "2FA setup successful, QR code length:",
          result.qrCode?.length
        );
      } else {
        setSecurityError(result.message || "Failed to setup 2FA");
      }
    } catch (error) {
      setSecurityError("An error occurred while setting up 2FA");
    } finally {
      setIsLoading(false);
    }
  };

  const handle2FAVerification = async () => {
    if (!twoFAData.verificationCode) {
      setSecurityError("Please enter the verification code");
      return;
    }

    setSecurityError("");
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
        setSecuritySuccess(
          "2FA enabled successfully! Please save your backup codes."
        );
      } else {
        setSecurityError(result.message || "Failed to verify 2FA");
      }
    } catch (error) {
      setSecurityError("An error occurred while verifying 2FA");
    } finally {
      setIsLoading(false);
    }
  };

  const handle2FADisable = async () => {
    if (!disablePassword) {
      setSecurityError("Password is required to disable 2FA");
      return;
    }

    setSecurityError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/user/2fa-manage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "disable",
          password: disablePassword,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setProfile({ ...profile, twoFactorEnabled: false });
        setSecuritySuccess("2FA disabled successfully!");
        setShow2FADisable(false);
        setDisablePassword("");
      } else {
        setSecurityError(result.message || "Failed to disable 2FA");
      }
    } catch (error) {
      setSecurityError("An error occurred while disabling 2FA");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCurrencyChange = async (newCurrencyCode: string) => {
    const newCurrency = currencies.find((c) => c.code === newCurrencyCode);
    if (newCurrency) {
      try {
        await setCurrency(newCurrency);
        setCurrencySuccess(`Currency changed to ${newCurrency.name}`);
        setCurrencyError("");
      } catch (error) {
        setCurrencyError("Failed to update currency");
        setCurrencySuccess("");
      }
    }
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem("cashLens_theme", newTheme);
    setThemeSuccess(`Theme changed to ${newTheme}`);
  };

  const handleDeleteAccount = async () => {
    setIsLoading(true);
    setGlobalError("");

    try {
      const response = await fetch("/api/user/delete-account", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (result.success) {
        setShowDeleteConfirmation(false);
        await router.push("/");
        window.location.reload();
      } else {
        setGlobalError(result.message || "Failed to delete account");
      }
    } catch (error) {
      setGlobalError("An error occurred while deleting account");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (profileSuccess) {
      const timer = setTimeout(() => setProfileSuccess(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [profileSuccess]);

  useEffect(() => {
    if (profileError) {
      const timer = setTimeout(() => setProfileError(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [profileError]);

  useEffect(() => {
    if (securitySuccess) {
      const timer = setTimeout(() => setSecuritySuccess(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [securitySuccess]);

  useEffect(() => {
    if (securityError) {
      const timer = setTimeout(() => setSecurityError(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [securityError]);

  useEffect(() => {
    if (currencySuccess) {
      const timer = setTimeout(() => setCurrencySuccess(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [currencySuccess]);

  useEffect(() => {
    if (currencyError) {
      const timer = setTimeout(() => setCurrencyError(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [currencyError]);

  useEffect(() => {
    if (themeSuccess) {
      const timer = setTimeout(() => setThemeSuccess(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [themeSuccess]);

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
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="card">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">
            Manage your account settings and preferences
          </p>
        </div>

        {globalSuccess && (
          <div className="bg-success-50 border border-success-200 rounded-lg p-4">
            <p className="text-success-600 text-sm">{globalSuccess}</p>
          </div>
        )}
        {globalError && (
          <div className="bg-danger-50 border border-danger-200 rounded-lg p-4">
            <p className="text-danger-600 text-sm">{globalError}</p>
          </div>
        )}

        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Profile Information
          </h2>

          {profileSuccess && (
            <div className="bg-success-50 border border-success-200 rounded-lg p-4 mb-6">
              <p className="text-success-600 text-sm">{profileSuccess}</p>
            </div>
          )}
          {profileError && (
            <div className="bg-danger-50 border border-danger-200 rounded-lg p-4 mb-6">
              <p className="text-danger-600 text-sm">{profileError}</p>
            </div>
          )}

          <div className="space-y-6">
            {isEditingProfile ? (
              <div>
                <label className="label">Profile Picture</label>
                <ImageUpload
                  currentImage={tempProfile.image}
                  onImageSelect={handleImageSelect}
                  onImageRemove={handleImageRemove}
                  isLoading={imageUploadLoading}
                  maxSize={5}
                  className="max-w-md"
                />
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={generateNewAvatar}
                    className="btn-secondary text-sm"
                  >
                    Generate Random Avatar Instead
                  </button>
                  <p className="text-xs text-gray-500 mt-1">
                    Click to use a generated avatar instead of uploading an
                    image
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200">
                    {profile.image ? (
                      <Image
                        src={profile.image}
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
                <div>
                  <h3 className="text-sm font-medium text-gray-900">
                    Profile Picture
                  </h3>
                  <p className="text-xs text-gray-500">
                    Click "Edit Profile" to upload a custom image or generate a
                    new avatar
                  </p>
                </div>
              </div>
            )}

            <div>
              <label className="label" htmlFor="name">
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
                <p className="text-gray-900 py-2">{profile.name}</p>
              )}
            </div>

            <div>
              <label className="label" htmlFor="email">
                Email Address
              </label>
              <p className="text-gray-900 py-2">{profile.email}</p>
              <p className="text-xs text-gray-500 mt-1">
                Email cannot be changed
              </p>
            </div>

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
                  <button onClick={handleCancelEdit} className="btn-secondary">
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

        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Preferences
          </h2>

          {(currencySuccess || themeSuccess) && (
            <div className="bg-success-50 border border-success-200 rounded-lg p-4 mb-6">
              <p className="text-success-600 text-sm">
                {currencySuccess || themeSuccess}
              </p>
            </div>
          )}
          {currencyError && (
            <div className="bg-danger-50 border border-danger-200 rounded-lg p-4 mb-6">
              <p className="text-danger-600 text-sm">{currencyError}</p>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="label">Default Currency</label>
              <select
                value={currency.code}
                onChange={(e) => handleCurrencyChange(e.target.value)}
                className="input-field max-w-xs"
              >
                {currencies.map((curr) => (
                  <option key={curr.code} value={curr.code}>
                    {curr.code} - {curr.name} ({curr.symbol})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Theme</label>
              <div className="flex space-x-4">
                <button
                  onClick={() => handleThemeChange("light")}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    theme === "light"
                      ? "bg-primary-600 text-white border-primary-600"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  ☀️ Light
                </button>
                <button
                  onClick={() => handleThemeChange("dark")}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    theme === "dark"
                      ? "bg-primary-600 text-white border-primary-600"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  🌙 Dark
                </button>
              </div>
            </div>
          </div>
        </div>

        {profile.hashedPassword && (
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Security
            </h2>

            {securitySuccess && (
              <div className="bg-success-50 border border-success-200 rounded-lg p-4 mb-6">
                <p className="text-success-600 text-sm">{securitySuccess}</p>
              </div>
            )}
            {securityError && (
              <div className="bg-danger-50 border border-danger-200 rounded-lg p-4 mb-6">
                <p className="text-danger-600 text-sm">{securityError}</p>
              </div>
            )}

            <div className="space-y-6">
              <div className="flex items-center justify-between py-4 border-b border-gray-100">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">
                    Two-Factor Authentication
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Add an extra layer of security to your account
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      profile.twoFactorEnabled
                        ? "bg-success-100 text-success-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {profile.twoFactorEnabled ? "Enabled" : "Disabled"}
                  </span>
                  <button
                    onClick={
                      profile.twoFactorEnabled
                        ? () => setShow2FADisable(true)
                        : handle2FASetup
                    }
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                    disabled={isLoading}
                  >
                    {profile.twoFactorEnabled ? "Disable" : "Setup"}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between py-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">
                    Password
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Change your account password
                  </p>
                </div>
                <button
                  onClick={() => setShowPasswordChange(true)}
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  Change Password
                </button>
              </div>
            </div>
          </div>
        )}

        {showPasswordChange && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="card w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Change Password
              </h3>

              {securityError && (
                <div className="bg-danger-50 border border-danger-200 rounded-lg p-4 mb-4">
                  <p className="text-danger-600 text-sm">{securityError}</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="label">Current Password</label>
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
                  <label className="label">New Password</label>
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
                        <p key={index} className="text-xs text-danger-600">
                          • {error}
                        </p>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="label">Confirm New Password</label>
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
                    setSecurityError("");
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {show2FASetup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="card w-full max-w-md max-h-[90vh] flex flex-col">
              <div className="flex-shrink-0">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Setup Two-Factor Authentication
                </h3>

                {securityError && (
                  <div className="bg-danger-50 border border-danger-200 rounded-lg p-4 mb-4">
                    <p className="text-danger-600 text-sm">{securityError}</p>
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto">
                {!twoFAData.showBackupCodes ? (
                  <div className="space-y-4">
                    {twoFAData.qrCode ? (
                      <div className="text-center">
                        <div className="inline-block p-4 bg-white rounded-lg border shadow-sm">
                          <img
                            src={twoFAData.qrCode}
                            alt="2FA QR Code"
                            className="w-48 h-48 mx-auto"
                            onError={(e) => {
                              console.error(
                                "QR Code failed to load:",
                                twoFAData.qrCode?.substring(0, 100)
                              );
                              e.currentTarget.style.display = "none";
                            }}
                            onLoad={() =>
                              console.log("QR Code loaded successfully")
                            }
                          />
                        </div>
                        <p className="text-sm text-gray-600 mt-2">
                          Scan this QR code with your authenticator app
                        </p>
                      </div>
                    ) : (
                      <div className="text-center text-red-600">
                        <p>QR Code failed to generate</p>
                      </div>
                    )}

                    {twoFAData.secret && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          Can't scan? Enter this key manually:
                        </p>
                        <div className="bg-white p-3 rounded border">
                          <code className="text-sm break-all font-mono">
                            {twoFAData.secret}
                          </code>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Choose "Enter a setup key" in your authenticator app
                          and paste this code
                        </p>
                      </div>
                    )}

                    <div>
                      <label className="label">Verification Code</label>
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
                      <p className="text-xs text-gray-500 mt-1">
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
                          setSecurityError("");
                        }}
                        className="btn-secondary"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg
                          className="w-6 h-6 text-success-600"
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
                      <h4 className="text-lg font-medium text-gray-900">
                        2FA Enabled Successfully!
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Please save these backup codes in a secure location
                      </p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <h5 className="font-medium text-gray-900 mb-2">
                        Backup Codes
                      </h5>
                      <div className="grid grid-cols-2 gap-2 text-sm font-mono">
                        {twoFAData.backupCodes.map((code, index) => (
                          <div
                            key={index}
                            className="bg-white p-2 rounded text-center"
                          >
                            {code}
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Each backup code can only be used once. Store them
                        safely!
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
                        setSecurityError(""); // Clear errors
                      }}
                      className="btn-primary w-full"
                    >
                      Done
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {show2FADisable && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="card w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Disable Two-Factor Authentication
              </h3>

              {securityError && (
                <div className="bg-danger-50 border border-danger-200 rounded-lg p-4 mb-4">
                  <p className="text-danger-600 text-sm">{securityError}</p>
                </div>
              )}

              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-yellow-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        Warning
                      </h3>
                      <p className="text-sm text-yellow-700 mt-1">
                        Disabling 2FA will make your account less secure. You
                        can re-enable it at any time.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="label">Password</label>
                  <input
                    type="password"
                    value={disablePassword}
                    onChange={(e) => setDisablePassword(e.target.value)}
                    className="input-field w-full"
                    placeholder="Enter your password to confirm"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handle2FADisable();
                      }
                    }}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Please enter your account password to confirm this action
                  </p>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={handle2FADisable}
                  disabled={isLoading || !disablePassword}
                  className="btn-danger flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Disabling..." : "Disable 2FA"}
                </button>
                <button
                  onClick={() => {
                    setShow2FADisable(false);
                    setDisablePassword("");
                    setSecurityError("");
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <ConfirmationModal
          isOpen={showDeleteConfirmation}
          onClose={() => {
            setShowDeleteConfirmation(false);
            setDeleteConfirmationText("");
            setGlobalError("");
          }}
          onConfirm={() => {
            if (deleteConfirmationText === "DELETE") {
              handleDeleteAccount();
            } else {
              setGlobalError("Please type DELETE to confirm account deletion");
            }
          }}
          title="Delete Your Account"
          message={
            <div className="space-y-4">
              <p className="text-gray-600">
                This action cannot be undone. This will permanently delete your
                account and remove all your data from our servers.
              </p>
              <div>
                <label className="label text-sm font-medium text-gray-700">
                  Type <span className="font-bold text-danger-600">DELETE</span>{" "}
                  to confirm:
                </label>
                <input
                  type="text"
                  value={deleteConfirmationText}
                  onChange={(e) => setDeleteConfirmationText(e.target.value)}
                  className="input-field w-full mt-1"
                  placeholder="DELETE"
                />
              </div>
              {globalError && (
                <div className="text-sm text-danger-600 bg-danger-50 p-3 rounded-lg">
                  {globalError}
                </div>
              )}
            </div>
          }
          confirmText="Delete Account"
          cancelText="Cancel"
          confirmButtonStyle="danger"
          isLoading={isLoading}
        />

        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Account Actions
          </h2>

          <div className="space-y-4">
            <button
              onClick={() => setShowDeleteConfirmation(true)}
              className="w-full text-left px-4 py-3 text-danger-600 hover:bg-danger-50 rounded-lg transition-colors border border-danger-200"
            >
              <div>
                <div className="font-medium">Delete Account</div>
                <div className="text-sm text-danger-500 mt-1">
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
