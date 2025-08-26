"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { registerSchema } from "../../../lib/auth/auth-utils";
import { z } from "zod";

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface ValidationState {
  name: { isValid: boolean; message: string };
  email: { isValid: boolean; message: string };
  password: { isValid: boolean; message: string; strength: number };
  confirmPassword: { isValid: boolean; message: string };
}

export default function SignUpPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [validation, setValidation] = useState<ValidationState>({
    name: { isValid: false, message: "" },
    email: { isValid: false, message: "" },
    password: { isValid: false, message: "", strength: 0 },
    confirmPassword: { isValid: false, message: "" },
  });

  const [touched, setTouched] = useState({
    name: false,
    email: false,
    password: false,
    confirmPassword: false,
  });

  const calculatePasswordStrength = useCallback((password: string): number => {
    let strength = 0;

    if (password.length >= 8) strength += 1;
    if (password.length >= 12) strength += 1;
    if (password.length >= 16) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[@$!%*?&]/.test(password)) strength += 1;

    const specialChars = password.match(/[@$!%*?&]/g);
    if (specialChars && specialChars.length > 1) strength += 1;

    if (/123|abc|password|qwerty/i.test(password)) strength -= 1;

    return Math.max(0, Math.min(strength, 5));
  }, []);

  useEffect(() => {
    const validateForm = () => {
      const newValidation = { ...validation };

      if (formData.name.length > 0) {
        const trimmedName = formData.name.trim();
        newValidation.name.isValid =
          trimmedName.length >= 2 && /^[a-zA-Z\s]+$/.test(trimmedName);
        newValidation.name.message = newValidation.name.isValid
          ? "✓ Name looks good"
          : trimmedName.length < 2
          ? "Name must be at least 2 characters"
          : "Name can only contain letters and spaces";
      } else {
        newValidation.name.isValid = false;
        newValidation.name.message = "";
      }

      if (formData.email.length > 0) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isValidFormat = emailRegex.test(formData.email);
        const isCommonDomain = /@(gmail|yahoo|outlook|hotmail|icloud)\./.test(
          formData.email
        );

        newValidation.email.isValid = isValidFormat;
        newValidation.email.message = newValidation.email.isValid
          ? isCommonDomain
            ? "✓ Email format is valid"
            : "✓ Email format is valid (please verify domain)"
          : "Please enter a valid email address";
      } else {
        newValidation.email.isValid = false;
        newValidation.email.message = "";
      }

      if (formData.password.length > 0) {
        const strength = calculatePasswordStrength(formData.password);
        newValidation.password.strength = strength;

        const hasMinLength = formData.password.length >= 8;
        const hasUppercase = /[A-Z]/.test(formData.password);
        const hasLowercase = /[a-z]/.test(formData.password);
        const hasNumber = /[0-9]/.test(formData.password);
        const hasSpecial = /[@$!%*?&]/.test(formData.password);

        newValidation.password.isValid =
          hasMinLength &&
          hasUppercase &&
          hasLowercase &&
          hasNumber &&
          hasSpecial &&
          strength >= 3;

        if (newValidation.password.isValid) {
          newValidation.password.message = "✓ Password meets all requirements";
        } else {
          const missing = [];
          if (!hasMinLength) missing.push("8+ characters");
          if (!hasUppercase) missing.push("uppercase letter");
          if (!hasLowercase) missing.push("lowercase letter");
          if (!hasNumber) missing.push("number");
          if (!hasSpecial) missing.push("special character (@$!%*?&)");
          if (strength < 3) missing.push("stronger combination");
          newValidation.password.message = `Required: ${missing.join(", ")}`;
        }
      } else {
        newValidation.password.isValid = false;
        newValidation.password.message = "";
        newValidation.password.strength = 0;
      }

      if (formData.confirmPassword.length > 0) {
        newValidation.confirmPassword.isValid =
          formData.password === formData.confirmPassword &&
          formData.password.length > 0;
        newValidation.confirmPassword.message = newValidation.confirmPassword
          .isValid
          ? "✓ Passwords match"
          : formData.password.length === 0
          ? "Please enter password first"
          : "Passwords do not match";
      } else {
        newValidation.confirmPassword.isValid = false;
        newValidation.confirmPassword.message = "";
      }

      setValidation(newValidation);

      const allValid = Object.values(newValidation).every((field) =>
        "isValid" in field ? field.isValid : true
      );
      setIsFormValid(
        allValid &&
          Object.values(formData).every((value) => value.trim().length > 0)
      );
    };

    const timeoutId = setTimeout(validateForm, 300); // Debounce validation
    return () => clearTimeout(timeoutId);
  }, [formData, validation, calculatePasswordStrength]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (error) setError("");
  };

  const handleInputBlur = (field: keyof FormData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const getPasswordStrengthColor = (strength: number) => {
    if (strength <= 1) return "bg-red-500";
    if (strength <= 2) return "bg-orange-500";
    if (strength <= 3) return "bg-yellow-500";
    if (strength <= 4) return "bg-blue-500";
    return "bg-green-500";
  };

  const getPasswordStrengthText = (strength: number) => {
    if (strength <= 1) return "Very Weak";
    if (strength <= 2) return "Weak";
    if (strength <= 3) return "Fair";
    if (strength <= 4) return "Strong";
    return "Very Strong";
  };

  const getPasswordStrengthMessage = (strength: number) => {
    if (strength <= 1)
      return "Password is too weak. Consider adding more complexity.";
    if (strength <= 2)
      return "Password strength is weak. Add more variety to improve security.";
    if (strength <= 3) return "Password strength is fair. Almost there!";
    if (strength <= 4)
      return "Strong password! Consider adding more length for extra security.";
    return "Excellent! Your password is very strong.";
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!isFormValid) {
      setError("Please fix all validation errors before submitting");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      registerSchema.parse(formData);

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      setSuccess("Account created successfully! Redirecting to sign in...");
      setTimeout(() => {
        router.push("/auth/signin?message=Account created successfully");
      }, 2000);
    } catch (error) {
      if (error instanceof z.ZodError) {
        setError(error.errors[0].message);
      } else if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 animate-fade-in">
        <div className="text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform duration-200">
              <Image
                className=""
                src="/logo.png"
                alt="CashLens Logo"
                width={64}
                height={64}
              />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Create your account
          </h2>
          <p className="text-gray-600">
            Join CashLens and start tracking your finances
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 animate-slide-up">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg animate-fade-in">
              <div className="flex items-center">
                <span className="text-red-600 mr-2">⚠️</span>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg animate-fade-in">
              <div className="flex items-center">
                <span className="text-green-600 mr-2">✅</span>
                <p className="text-green-600 text-sm">{success}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="name" className="label">
                Full Name *
              </label>
              <div className="relative">
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  onBlur={() => handleInputBlur("name")}
                  className={`input-field transition-all duration-200 ${
                    touched.name
                      ? validation.name.isValid
                        ? "border-green-500 focus:border-green-500 bg-green-50/30"
                        : "border-red-500 focus:border-red-500 bg-red-50/30"
                      : "hover:border-primary-400"
                  }`}
                  placeholder="Enter your full name"
                  aria-describedby={
                    touched.name && validation.name.message
                      ? "name-error"
                      : undefined
                  }
                />
                {touched.name && validation.name.isValid && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <span className="text-green-500">✓</span>
                  </div>
                )}
              </div>
              {touched.name && validation.name.message && (
                <p
                  id="name-error"
                  className={`text-xs transition-all duration-200 ${
                    validation.name.isValid ? "text-green-600" : "text-red-600"
                  }`}
                  role="alert"
                >
                  {validation.name.message}
                </p>
              )}
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="label">
                Email address *
              </label>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  onBlur={() => handleInputBlur("email")}
                  className={`input-field transition-all duration-200 ${
                    touched.email
                      ? validation.email.isValid
                        ? "border-green-500 focus:border-green-500 bg-green-50/30"
                        : "border-red-500 focus:border-red-500 bg-red-50/30"
                      : "hover:border-primary-400"
                  }`}
                  placeholder="Enter your email"
                  aria-describedby={
                    touched.email && validation.email.message
                      ? "email-error"
                      : undefined
                  }
                />
                {touched.email && validation.email.isValid && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <span className="text-green-500">✓</span>
                  </div>
                )}
              </div>
              {touched.email && validation.email.message && (
                <p
                  id="email-error"
                  className={`text-xs transition-all duration-200 ${
                    validation.email.isValid ? "text-green-600" : "text-red-600"
                  }`}
                  role="alert"
                >
                  {validation.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="label">
                Password *
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) =>
                    handleInputChange("password", e.target.value)
                  }
                  onBlur={() => handleInputBlur("password")}
                  className={`input-field pr-12 transition-all duration-200 ${
                    touched.password
                      ? validation.password.isValid
                        ? "border-green-500 focus:border-green-500 bg-green-50/30"
                        : "border-red-500 focus:border-red-500 bg-red-50/30"
                      : "hover:border-primary-400"
                  }`}
                  placeholder="Create a strong password"
                  aria-describedby={
                    formData.password
                      ? "password-requirements password-strength"
                      : undefined
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>

              {formData.password && (
                <div
                  id="password-strength"
                  className="space-y-2 animate-fade-in"
                >
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ease-out ${getPasswordStrengthColor(
                          validation.password.strength
                        )}`}
                        style={{
                          width: `${(validation.password.strength / 5) * 100}%`,
                        }}
                      ></div>
                    </div>
                    <span
                      className={`text-xs font-medium min-w-0 ${
                        validation.password.strength <= 2
                          ? "text-red-600"
                          : validation.password.strength <= 3
                          ? "text-yellow-600"
                          : validation.password.strength <= 4
                          ? "text-blue-600"
                          : "text-green-600"
                      }`}
                    >
                      {getPasswordStrengthText(validation.password.strength)}
                    </span>
                  </div>
                  <p
                    className={`text-xs ${
                      validation.password.strength <= 2
                        ? "text-red-600"
                        : validation.password.strength <= 3
                        ? "text-yellow-600"
                        : validation.password.strength <= 4
                        ? "text-blue-600"
                        : "text-green-600"
                    }`}
                  >
                    {getPasswordStrengthMessage(validation.password.strength)}
                  </p>
                </div>
              )}

              {touched.password && validation.password.message && (
                <p
                  className={`text-xs transition-all duration-200 ${
                    validation.password.isValid
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                  role="alert"
                >
                  {validation.password.message}
                </p>
              )}

              {formData.password && (
                <div
                  id="password-requirements"
                  className="space-y-1 animate-fade-in"
                >
                  <p className="text-xs font-medium text-gray-700 mb-2">
                    Password requirements:
                  </p>
                  {[
                    {
                      test: formData.password.length >= 8,
                      text: "At least 8 characters",
                    },
                    {
                      test: /[A-Z]/.test(formData.password),
                      text: "One uppercase letter",
                    },
                    {
                      test: /[a-z]/.test(formData.password),
                      text: "One lowercase letter",
                    },
                    {
                      test: /[0-9]/.test(formData.password),
                      text: "One number",
                    },
                    {
                      test: /[@$!%*?&]/.test(formData.password),
                      text: "One special character (@$!%*?&)",
                    },
                  ].map((req, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-2 transition-all duration-200"
                    >
                      <span
                        className={`text-sm transition-all duration-200 ${
                          req.test
                            ? "text-green-600 scale-110"
                            : "text-gray-400"
                        }`}
                      >
                        {req.test ? "✓" : "○"}
                      </span>
                      <span
                        className={`text-xs transition-all duration-200 ${
                          req.test
                            ? "text-green-600 font-medium"
                            : "text-gray-500"
                        }`}
                      >
                        {req.text}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="label">
                Confirm Password *
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    handleInputChange("confirmPassword", e.target.value)
                  }
                  onBlur={() => handleInputBlur("confirmPassword")}
                  className={`input-field pr-12 transition-all duration-200 ${
                    touched.confirmPassword
                      ? validation.confirmPassword.isValid
                        ? "border-green-500 focus:border-green-500 bg-green-50/30"
                        : "border-red-500 focus:border-red-500 bg-red-50/30"
                      : "hover:border-primary-400"
                  }`}
                  placeholder="Confirm your password"
                  aria-describedby={
                    touched.confirmPassword &&
                    validation.confirmPassword.message
                      ? "confirm-password-error"
                      : undefined
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                >
                  {showConfirmPassword ? (
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
                {touched.confirmPassword &&
                  validation.confirmPassword.isValid && (
                    <div className="absolute inset-y-0 right-12 pr-3 flex items-center">
                      <span className="text-green-500">✓</span>
                    </div>
                  )}
              </div>
              {touched.confirmPassword &&
                validation.confirmPassword.message && (
                  <p
                    id="confirm-password-error"
                    className={`text-xs transition-all duration-200 ${
                      validation.confirmPassword.isValid
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                    role="alert"
                  >
                    {validation.confirmPassword.message}
                  </p>
                )}
            </div>

            <button
              type="submit"
              disabled={isLoading || !isFormValid}
              className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-all duration-300 transform ${
                isFormValid
                  ? "bg-primary-600 hover:bg-primary-700 hover:scale-[1.02] focus:ring-4 focus:ring-primary-200 shadow-lg hover:shadow-xl"
                  : "bg-gray-400 cursor-not-allowed"
              } disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none focus:outline-none`}
              aria-describedby="submit-button-help"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                  Creating account...
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <span>Create account</span>
                  {isFormValid && (
                    <svg
                      className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  )}
                </div>
              )}
            </button>

            {!isFormValid && Object.values(touched).some(Boolean) && (
              <p
                id="submit-button-help"
                className="text-xs text-gray-500 text-center animate-fade-in"
              >
                Please complete all required fields to continue
              </p>
            )}
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link
                href="/auth/signin"
                className="font-medium text-primary-600 hover:text-primary-500 transition-colors duration-200"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
