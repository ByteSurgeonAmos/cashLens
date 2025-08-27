"use client";

import React from "react";
import { useCurrency } from "../../contexts/CurrencyContext";
import {
  PencilIcon,
  TrashIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from "@heroicons/react/24/outline";

interface Transaction {
  id: string;
  amount: number;
  description: string;
  type: "INCOME" | "EXPENSE";
  date: string;
  createdAt: string;
  category: {
    id: string;
    name: string;
    icon: string;
    color: string;
  };
}

interface TransactionListProps {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
  loading?: boolean;
  selectedTransactions?: string[];
  onSelectionChange?: (selected: string[]) => void;
  showSelection?: boolean;
}

export default function TransactionList({
  transactions,
  onEdit,
  onDelete,
  loading = false,
  selectedTransactions = [],
  onSelectionChange,
  showSelection = false,
}: TransactionListProps) {
  const { formatCurrency } = useCurrency();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks}w ago`;
    const diffInMonths = Math.floor(diffInDays / 30);
    return `${diffInMonths}m ago`;
  };

  const handleTransactionSelection = (transactionId: string) => {
    if (!onSelectionChange) return;

    if (selectedTransactions.includes(transactionId)) {
      onSelectionChange(
        selectedTransactions.filter((id) => id !== transactionId)
      );
    } else {
      onSelectionChange([...selectedTransactions, transactionId]);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="flex items-center p-4 border-b border-gray-200">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="ml-4 flex-1">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="text-right">
                <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">📊</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No transactions found
        </h3>
        <p className="text-gray-500">
          Try adjusting your filters or add a new transaction.
        </p>
      </div>
    );
  }

  const groupTransactionsByDate = (transactions: Transaction[]) => {
    const groups: { [key: string]: Transaction[] } = {};

    transactions.forEach((transaction) => {
      const date = new Date(transaction.date).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(transaction);
    });

    return Object.entries(groups).sort(
      ([a], [b]) => new Date(b).getTime() - new Date(a).getTime()
    );
  };

  const groupedTransactions = groupTransactionsByDate(transactions);

  return (
    <div className="divide-y divide-gray-200">
      {groupedTransactions.map(([dateString, dayTransactions]) => {
        const date = new Date(dateString);
        const isToday = date.toDateString() === new Date().toDateString();
        const isYesterday =
          date.toDateString() ===
          new Date(Date.now() - 86400000).toDateString();

        let dateLabel = formatDate(dateString);
        if (isToday) dateLabel = "Today";
        else if (isYesterday) dateLabel = "Yesterday";

        const dayTotal = dayTransactions.reduce((sum, t) => {
          return sum + (t.type === "INCOME" ? t.amount : -t.amount);
        }, 0);

        return (
          <div key={dateString}>
            {/* Date Header */}
            <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-900">
                  {dateLabel}
                </h4>
                <span
                  className={`text-sm font-medium ${
                    dayTotal >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {dayTotal >= 0 ? "+" : ""}
                  {formatCurrency(dayTotal)}
                </span>
              </div>
            </div>

            {/* Transactions for this date */}
            <div className="divide-y divide-gray-100">
              {dayTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="px-6 py-4 hover:bg-gray-50 transition-colors duration-150"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center flex-1 min-w-0">
                      {/* Selection Checkbox */}
                      {showSelection && onSelectionChange && (
                        <input
                          type="checkbox"
                          checked={selectedTransactions.includes(
                            transaction.id
                          )}
                          onChange={() =>
                            handleTransactionSelection(transaction.id)
                          }
                          className="mr-4 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      )}

                      {/* Category Icon */}
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-lg font-medium flex-shrink-0"
                        style={{ backgroundColor: transaction.category.color }}
                      >
                        {transaction.category.icon}
                      </div>

                      {/* Transaction Details */}
                      <div className="ml-4 flex-1 min-w-0">
                        <div className="flex items-center">
                          <h5 className="text-sm font-medium text-gray-900 truncate">
                            {transaction.description}
                          </h5>
                          {transaction.type === "INCOME" ? (
                            <ArrowUpIcon className="ml-2 h-4 w-4 text-green-500 flex-shrink-0" />
                          ) : (
                            <ArrowDownIcon className="ml-2 h-4 w-4 text-red-500 flex-shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center mt-1">
                          <span className="text-xs text-gray-500">
                            {transaction.category.name}
                          </span>
                          <span className="mx-2 text-xs text-gray-300">•</span>
                          <span className="text-xs text-gray-500">
                            {getRelativeTime(transaction.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Amount and Actions */}
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div
                          className={`text-lg font-semibold ${
                            transaction.type === "INCOME"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {transaction.type === "INCOME" ? "+" : "-"}
                          {formatCurrency(transaction.amount)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDate(transaction.date)}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                        <button
                          onClick={() => onEdit(transaction)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors duration-150"
                          title="Edit transaction"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onDelete(transaction)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors duration-150"
                          title="Delete transaction"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Mobile Actions */}
                  <div className="flex justify-end space-x-2 mt-3 sm:hidden">
                    <button
                      onClick={() => onEdit(transaction)}
                      className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <PencilIcon className="h-3 w-3 mr-1" />
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(transaction)}
                      className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <TrashIcon className="h-3 w-3 mr-1" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
