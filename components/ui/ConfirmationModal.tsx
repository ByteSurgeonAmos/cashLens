"use client";

import { ReactNode } from "react";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string | ReactNode;
  confirmText?: string;
  cancelText?: string;
  confirmButtonStyle?: "primary" | "danger";
  isLoading?: boolean;
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmButtonStyle = "primary",
  isLoading = false,
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const confirmButtonClass =
    confirmButtonStyle === "danger"
      ? "btn-danger flex-1 disabled:opacity-50"
      : "btn-primary flex-1 disabled:opacity-50";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="card w-full max-w-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>

        <div className="mb-6">
          {typeof message === "string" ? (
            <p className="text-gray-600">{message}</p>
          ) : (
            message
          )}
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={confirmButtonClass}
          >
            {isLoading ? "Loading..." : confirmText}
          </button>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="btn-secondary"
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
}
