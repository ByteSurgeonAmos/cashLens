"use client";

import { useCallback, useMemo } from "react";

interface PasswordRequirement {
  test: (password: string) => boolean;
  text: string;
  description: string;
}

interface PasswordStrengthIndicatorProps {
  password: string;
  showRequirements?: boolean;
  className?: string;
}

export default function PasswordStrengthIndicator({
  password,
  showRequirements = true,
  className = "",
}: PasswordStrengthIndicatorProps) {
  const requirements: PasswordRequirement[] = useMemo(
    () => [
      {
        test: (pwd) => pwd.length >= 8,
        text: "At least 8 characters",
        description: "Longer passwords are more secure",
      },
      {
        test: (pwd) => /[A-Z]/.test(pwd),
        text: "One uppercase letter",
        description: "Include capital letters (A-Z)",
      },
      {
        test: (pwd) => /[a-z]/.test(pwd),
        text: "One lowercase letter",
        description: "Include lowercase letters (a-z)",
      },
      {
        test: (pwd) => /[0-9]/.test(pwd),
        text: "One number",
        description: "Include at least one digit (0-9)",
      },
      {
        test: (pwd) => /[@$!%*?&]/.test(pwd),
        text: "One special character",
        description: "Include symbols: @$!%*?&",
      },
    ],
    []
  );

  const calculateStrength = useCallback(
    (password: string): number => {
      let strength = 0;

      // Basic requirements
      requirements.forEach((req) => {
        if (req.test(password)) strength += 1;
      });

      // Bonus points
      if (password.length >= 12) strength += 1;
      if (password.length >= 16) strength += 1;

      // Multiple special characters bonus
      const specialChars = password.match(/[@$!%*?&]/g);
      if (specialChars && specialChars.length > 1) strength += 1;

      // Penalty for common patterns
      if (/123|abc|password|qwerty|admin/i.test(password)) strength -= 1;
      if (/(.)\1{2,}/.test(password)) strength -= 1; // Repeated characters

      return Math.max(0, Math.min(strength, 5));
    },
    [requirements]
  );

  const strength = calculateStrength(password);

  const getStrengthColor = (strength: number) => {
    if (strength <= 1) return "bg-red-500";
    if (strength <= 2) return "bg-orange-500";
    if (strength <= 3) return "bg-yellow-500";
    if (strength <= 4) return "bg-blue-500";
    return "bg-green-500";
  };

  const getStrengthText = (strength: number) => {
    if (strength <= 1) return "Very Weak";
    if (strength <= 2) return "Weak";
    if (strength <= 3) return "Fair";
    if (strength <= 4) return "Strong";
    return "Very Strong";
  };

  const getStrengthMessage = (strength: number) => {
    if (strength <= 1)
      return "Password is too weak. Consider adding more complexity.";
    if (strength <= 2)
      return "Password strength is weak. Add more variety to improve security.";
    if (strength <= 3) return "Password strength is fair. Almost there!";
    if (strength <= 4)
      return "Strong password! Consider adding more length for extra security.";
    return "Excellent! Your password is very strong.";
  };

  if (!password) return null;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Strength Bar and Label */}
      <div className="space-y-2">
        <div className="flex items-center space-x-3">
          <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all duration-500 ease-out ${getStrengthColor(
                strength
              )}`}
              style={{ width: `${(strength / 5) * 100}%` }}
            />
          </div>
          <span
            className={`text-sm font-medium min-w-0 ${
              strength <= 2
                ? "text-red-600"
                : strength <= 3
                ? "text-yellow-600"
                : strength <= 4
                ? "text-blue-600"
                : "text-green-600"
            }`}
          >
            {getStrengthText(strength)}
          </span>
        </div>

        <p
          className={`text-xs transition-colors duration-200 ${
            strength <= 2
              ? "text-red-600"
              : strength <= 3
              ? "text-yellow-600"
              : strength <= 4
              ? "text-blue-600"
              : "text-green-600"
          }`}
        >
          {getStrengthMessage(strength)}
        </p>
      </div>

      {/* Requirements Checklist */}
      {showRequirements && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-gray-700 mb-2">
            Password requirements:
          </p>
          {requirements.map((req, index) => {
            const isValid = req.test(password);
            return (
              <div
                key={index}
                className="flex items-center space-x-2 transition-all duration-200"
                title={req.description}
              >
                <span
                  className={`text-sm transition-all duration-200 ${
                    isValid ? "text-green-600 scale-110" : "text-gray-400"
                  }`}
                >
                  {isValid ? "✓" : "○"}
                </span>
                <span
                  className={`text-xs transition-all duration-200 ${
                    isValid ? "text-green-600 font-medium" : "text-gray-500"
                  }`}
                >
                  {req.text}
                </span>
              </div>
            );
          })}

          {/* Bonus indicators */}
          {password.length >= 12 && (
            <div className="flex items-center space-x-2 transition-all duration-200">
              <span className="text-sm text-green-600 scale-110">✓</span>
              <span className="text-xs text-green-600 font-medium">
                Excellent length (12+ chars)
              </span>
            </div>
          )}

          {password.length >= 16 && (
            <div className="flex items-center space-x-2 transition-all duration-200">
              <span className="text-sm text-green-600 scale-110">✓</span>
              <span className="text-xs text-green-600 font-medium">
                Exceptional length (16+ chars)
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
