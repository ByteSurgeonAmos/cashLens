"use client";

import React, { useState, useEffect } from "react";
import { useMutation } from "@apollo/client";
import { useForm } from "react-hook-form";
import {
  CREATE_TRANSACTION_MUTATION,
  UPDATE_TRANSACTION_MUTATION,
} from "../../lib/graphql/queries";
import { useCurrency } from "../../contexts/CurrencyContext";
import {
  XMarkIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  TagIcon,
  DocumentTextIcon,
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

interface TransactionModalProps {
  transaction?: Transaction | null;
  categories: Category[];
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  amount: string;
  description: string;
  type: "INCOME" | "EXPENSE";
  categoryId: string;
  date: string;
}

export default function TransactionModal({
  transaction,
  categories,
  onClose,
  onSuccess,
}: TransactionModalProps) {
  const { currency } = useCurrency();
  const [selectedType, setSelectedType] = useState<"INCOME" | "EXPENSE">(
    transaction?.type || "EXPENSE"
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<FormData>({
    defaultValues: {
      amount: transaction?.amount?.toString() || "",
      description: transaction?.description || "",
      type: transaction?.type || "EXPENSE",
      categoryId: transaction?.category.id || "",
      date: transaction?.date
        ? new Date(transaction.date).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
    },
  });

  const watchType = watch("type");

  const [createTransaction, { loading: creating }] = useMutation(
    CREATE_TRANSACTION_MUTATION,
    {
      onCompleted: () => {
        onSuccess();
      },
      onError: (error) => {
        console.error("Error creating transaction:", error);
      },
    }
  );

  const [updateTransaction, { loading: updating }] = useMutation(
    UPDATE_TRANSACTION_MUTATION,
    {
      onCompleted: () => {
        onSuccess();
      },
      onError: (error) => {
        console.error("Error updating transaction:", error);
      },
    }
  );

  const loading = creating || updating;

  useEffect(() => {
    setSelectedType(watchType);
  }, [watchType]);

  const filteredCategories = categories.filter(
    (category) => category.type === selectedType
  );

  const onSubmit = async (data: FormData) => {
    try {
      const variables = {
        input: {
          amount: parseFloat(data.amount),
          description: data.description.trim(),
          type: data.type,
          categoryId: data.categoryId,
          date: new Date(data.date).toISOString(),
        },
      };

      if (transaction) {
        await updateTransaction({
          variables: {
            input: {
              id: transaction.id,
              ...variables.input,
            },
          },
        });
      } else {
        await createTransaction({ variables });
      }
    } catch (error) {
      console.error("Error submitting transaction:", error);
    }
  };

  const quickAmounts =
    selectedType === "EXPENSE"
      ? [10, 25, 50, 100, 200]
      : [100, 500, 1000, 2000, 5000];

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            {transaction ? "Edit Transaction" : "Add New Transaction"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Transaction Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Transaction Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="relative">
                <input
                  {...register("type", {
                    required: "Transaction type is required",
                  })}
                  type="radio"
                  value="EXPENSE"
                  className="sr-only"
                />
                <div
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedType === "EXPENSE"
                      ? "border-red-500 bg-red-50"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  <div className="flex items-center justify-center">
                    <div className="text-2xl mb-2">💸</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-gray-900">Expense</div>
                    <div className="text-sm text-gray-500">Money going out</div>
                  </div>
                </div>
              </label>
              <label className="relative">
                <input
                  {...register("type", {
                    required: "Transaction type is required",
                  })}
                  type="radio"
                  value="INCOME"
                  className="sr-only"
                />
                <div
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedType === "INCOME"
                      ? "border-green-500 bg-green-50"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  <div className="flex items-center justify-center">
                    <div className="text-2xl mb-2">💰</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-gray-900">Income</div>
                    <div className="text-sm text-gray-500">Money coming in</div>
                  </div>
                </div>
              </label>
            </div>
            {errors.type && (
              <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <CurrencyDollarIcon className="h-4 w-4 inline mr-1" />
              Amount ({currency.symbol})
            </label>
            <div className="relative">
              <input
                {...register("amount", {
                  required: "Amount is required",
                  min: {
                    value: 0.01,
                    message: "Amount must be greater than 0",
                  },
                  pattern: {
                    value: /^\d+(\.\d{1,2})?$/,
                    message: "Please enter a valid amount",
                  },
                })}
                type="number"
                step="0.01"
                min="0.01"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
              />
            </div>
            {errors.amount && (
              <p className="mt-1 text-sm text-red-600">
                {errors.amount.message}
              </p>
            )}

            {/* Quick Amount Buttons */}
            <div className="mt-2">
              <div className="flex flex-wrap gap-2">
                {quickAmounts.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => setValue("amount", amount.toString())}
                    className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                  >
                    {currency.symbol}
                    {amount}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <DocumentTextIcon className="h-4 w-4 inline mr-1" />
              Description
            </label>
            <input
              {...register("description", {
                required: "Description is required",
                minLength: {
                  value: 3,
                  message: "Description must be at least 3 characters",
                },
                maxLength: {
                  value: 100,
                  message: "Description must be less than 100 characters",
                },
              })}
              type="text"
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter transaction description..."
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <TagIcon className="h-4 w-4 inline mr-1" />
              Category
            </label>
            <select
              {...register("categoryId", { required: "Category is required" })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a category</option>
              {filteredCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.icon} {category.name}
                </option>
              ))}
            </select>
            {errors.categoryId && (
              <p className="mt-1 text-sm text-red-600">
                {errors.categoryId.message}
              </p>
            )}
            {filteredCategories.length === 0 && (
              <p className="mt-1 text-sm text-yellow-600">
                No categories available for {selectedType.toLowerCase()}. Please
                create a category first.
              </p>
            )}
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <CalendarIcon className="h-4 w-4 inline mr-1" />
              Date
            </label>
            <input
              {...register("date", { required: "Date is required" })}
              type="date"
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.date && (
              <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || filteredCategories.length === 0}
              className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                selectedType === "INCOME"
                  ? "bg-green-600 hover:bg-green-700 focus:ring-green-500"
                  : "bg-red-600 hover:bg-red-700 focus:ring-red-500"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {transaction ? "Updating..." : "Creating..."}
                </div>
              ) : transaction ? (
                "Update Transaction"
              ) : (
                "Create Transaction"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
