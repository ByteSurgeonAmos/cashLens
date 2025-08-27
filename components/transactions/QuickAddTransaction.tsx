"use client";

import React, { useState } from "react";
import { useMutation } from "@apollo/client";
import { CREATE_TRANSACTION_MUTATION } from "../../lib/graphql/queries";
import { useCurrency } from "../../contexts/CurrencyContext";
import { PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: "INCOME" | "EXPENSE";
}

interface QuickAddTransactionProps {
  categories: Category[];
  onSuccess: () => void;
}

export default function QuickAddTransaction({
  categories,
  onSuccess,
}: QuickAddTransactionProps) {
  const { currency } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [selectedCategory, setSelectedCategory] = useState("");

  const [createTransaction, { loading }] = useMutation(
    CREATE_TRANSACTION_MUTATION,
    {
      onCompleted: () => {
        onSuccess();
        resetForm();
        setIsOpen(false);
      },
      onError: (error) => {
        console.error("Error creating transaction:", error);
      },
    }
  );

  const filteredCategories = categories.filter((cat) => cat.type === type);

  const resetForm = () => {
    setAmount("");
    setDescription("");
    setSelectedCategory("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || !description || !selectedCategory) return;

    try {
      await createTransaction({
        variables: {
          input: {
            amount: parseFloat(amount),
            description: description.trim(),
            type,
            categoryId: selectedCategory,
            date: new Date().toISOString(),
          },
        },
      });
    } catch (error) {
      console.error("Error creating transaction:", error);
    }
  };

  const quickAmounts =
    type === "EXPENSE" ? [5, 10, 25, 50, 100] : [100, 500, 1000, 2000];

  const commonDescriptions =
    type === "EXPENSE"
      ? ["Coffee", "Lunch", "Gas", "Groceries", "Parking"]
      : ["Salary", "Freelance", "Refund", "Gift", "Bonus"];

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 z-50"
      >
        <PlusIcon className="h-6 w-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Quick Add</h3>
          <button
            onClick={() => {
              setIsOpen(false);
              resetForm();
            }}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type Selection */}
          <div className="flex rounded-lg bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => {
                setType("EXPENSE");
                setSelectedCategory("");
              }}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                type === "EXPENSE"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => {
                setType("INCOME");
                setSelectedCategory("");
              }}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                type === "INCOME"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Income
            </button>
          </div>

          {/* Amount */}
          <div>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={`Amount (${currency.symbol})`}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              step="0.01"
              min="0.01"
              required
            />
            <div className="flex flex-wrap gap-1 mt-2">
              {quickAmounts.map((quickAmount) => (
                <button
                  key={quickAmount}
                  type="button"
                  onClick={() => setAmount(quickAmount.toString())}
                  className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  {currency.symbol}
                  {quickAmount}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description"
              className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <div className="flex flex-wrap gap-1 mt-2">
              {commonDescriptions.map((desc) => (
                <button
                  key={desc}
                  type="button"
                  onClick={() => setDescription(desc)}
                  className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  {desc}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select category</option>
              {filteredCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.icon} {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !amount || !description || !selectedCategory}
            className={`w-full py-2 px-4 rounded-md text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
              type === "INCOME"
                ? "bg-green-600 hover:bg-green-700 focus:ring-green-500"
                : "bg-red-600 hover:bg-red-700 focus:ring-red-500"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Adding...
              </div>
            ) : (
              `Add ${type === "INCOME" ? "Income" : "Expense"}`
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
