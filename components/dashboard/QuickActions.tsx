"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function QuickActions() {
  const router = useRouter();
  const [selectedAction, setSelectedAction] = useState<string | null>(null);

  const actions = [
    {
      id: "add-income",
      title: "Add Income",
      description: "Record new income",
      icon: "💰",
      color: "bg-success-50 border-success-200 hover:bg-success-100",
      textColor: "text-success-700",
      href: "/transactions?action=add&type=income",
    },
    {
      id: "add-expense",
      title: "Add Expense",
      description: "Record new expense",
      icon: "💸",
      color: "bg-danger-50 border-danger-200 hover:bg-danger-100",
      textColor: "text-danger-700",
      href: "/transactions?action=add&type=expense",
    },
    {
      id: "create-budget",
      title: "Create Budget",
      description: "Set spending limits",
      icon: "🎯",
      color: "bg-primary-50 border-primary-200 hover:bg-primary-100",
      textColor: "text-primary-700",
      href: "/budgets?action=create",
    },
    {
      id: "add-category",
      title: "Add Category",
      description: "Create new category",
      icon: "🏷️",
      color: "bg-purple-50 border-purple-200 hover:bg-purple-100",
      textColor: "text-purple-700",
      href: "/categories?action=create",
    },
  ];

  const handleActionClick = (action: (typeof actions)[0]) => {
    setSelectedAction(action.id);
    setTimeout(() => {
      router.push(action.href);
      setSelectedAction(null);
    }, 200);
  };

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Quick Actions
      </h3>

      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={() => handleActionClick(action)}
            className={`
              ${action.color}
              ${selectedAction === action.id ? "scale-95" : "hover:scale-105"}
              border-2 rounded-lg p-4 text-left transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
            `}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{action.icon}</span>
              <svg
                className={`w-4 h-4 ${action.textColor} opacity-60`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>
            <h4 className={`font-semibold ${action.textColor} mb-1`}>
              {action.title}
            </h4>
            <p className="text-sm text-gray-600">{action.description}</p>
          </button>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <button
          onClick={() => router.push("/reports")}
          className="w-full flex items-center justify-center space-x-2 py-2 px-4 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
        >
          <span>📊</span>
          <span className="font-medium text-gray-700">View Reports</span>
        </button>
      </div>
    </div>
  );
}
