"use client";

import React, { useState } from "react";
import { useMutation } from "@apollo/client";
import { DELETE_TRANSACTION_MUTATION } from "../../lib/graphql/queries";
import {
  CheckIcon,
  XMarkIcon,
  TrashIcon,
  TagIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";

interface Transaction {
  id: string;
  amount: number;
  description: string;
  type: "INCOME" | "EXPENSE";
  date: string;
  category: {
    id: string;
    name: string;
    icon: string;
    color: string;
  };
}

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: "INCOME" | "EXPENSE";
}

interface BulkActionsProps {
  selectedTransactions: string[];
  transactions: Transaction[];
  categories: Category[];
  onSelectionChange: (selected: string[]) => void;
  onRefresh: () => void;
}

export default function BulkActions({
  selectedTransactions,
  transactions,
  categories,
  onSelectionChange,
  onRefresh,
}: BulkActionsProps) {
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [deleteTransaction] = useMutation(DELETE_TRANSACTION_MUTATION);

  const selectedTransactionData = transactions.filter((t) =>
    selectedTransactions.includes(t.id)
  );

  const totalSelectedAmount = selectedTransactionData.reduce((sum, t) => {
    return sum + (t.type === "INCOME" ? t.amount : -t.amount);
  }, 0);

  const handleSelectAll = () => {
    if (selectedTransactions.length === transactions.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(transactions.map((t) => t.id));
    }
  };

  const handleBulkDelete = async () => {
    if (
      !confirm(
        `Are you sure you want to delete ${selectedTransactions.length} transactions? This action cannot be undone.`
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      await Promise.all(
        selectedTransactions.map((id) =>
          deleteTransaction({ variables: { id } })
        )
      );
      onSelectionChange([]);
      onRefresh();
    } catch (error) {
      console.error("Error deleting transactions:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportSelected = () => {
    const csvContent = [
      ["Date", "Description", "Amount", "Type", "Category"],
      ...selectedTransactionData.map((t) => [
        new Date(t.date).toLocaleDateString(),
        `"${t.description.replace(/"/g, '""')}"`,
        t.amount,
        t.type,
        `"${t.category.name}"`,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `selected_transactions_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  if (selectedTransactions.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => onSelectionChange([])}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
            <div className="text-sm text-gray-900">
              <span className="font-medium">{selectedTransactions.length}</span>{" "}
              transactions selected
            </div>
            <div className="text-sm text-gray-600">
              Total:{" "}
              <span
                className={`font-medium ${
                  totalSelectedAmount >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {totalSelectedAmount >= 0 ? "+" : ""}$
                {Math.abs(totalSelectedAmount).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleSelectAll}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <CheckIcon className="h-4 w-4 mr-2" />
              {selectedTransactions.length === transactions.length
                ? "Deselect All"
                : "Select All"}
            </button>

            <button
              onClick={handleExportSelected}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              Export
            </button>

            <button
              onClick={handleBulkDelete}
              disabled={isDeleting}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <TrashIcon className="h-4 w-4 mr-2" />
                  Delete
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
