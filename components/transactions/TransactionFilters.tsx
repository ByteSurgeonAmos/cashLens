"use client";

import React from "react";
import {
  XMarkIcon,
  CalendarIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline";

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: "INCOME" | "EXPENSE";
}

interface FilterState {
  type: "ALL" | "INCOME" | "EXPENSE";
  categoryId: string;
  dateRange: {
    start: string;
    end: string;
  };
  amountRange: {
    min: string;
    max: string;
  };
  sortBy: "date" | "amount" | "description";
  sortOrder: "asc" | "desc";
  search: string;
}

interface TransactionFiltersProps {
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
  categories: Category[];
  onReset: () => void;
}

export default function TransactionFilters({
  filters,
  setFilters,
  categories,
  onReset,
}: TransactionFiltersProps) {
  const updateFilter = (key: keyof FilterState, value: any) => {
    setFilters({ ...filters, [key]: value });
  };

  const updateDateRange = (key: "start" | "end", value: string) => {
    setFilters({
      ...filters,
      dateRange: { ...filters.dateRange, [key]: value },
    });
  };

  const updateAmountRange = (key: "min" | "max", value: string) => {
    setFilters({
      ...filters,
      amountRange: { ...filters.amountRange, [key]: value },
    });
  };

  const getFilteredCategories = () => {
    if (filters.type === "ALL") return categories;
    return categories.filter((cat) => cat.type === filters.type);
  };

  const hasActiveFilters = () => {
    return (
      filters.type !== "ALL" ||
      filters.categoryId !== "" ||
      filters.dateRange.start !== "" ||
      filters.dateRange.end !== "" ||
      filters.amountRange.min !== "" ||
      filters.amountRange.max !== "" ||
      filters.search !== ""
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900">
          Filter Transactions
        </h3>
        {hasActiveFilters() && (
          <button
            onClick={onReset}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Reset All Filters
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Transaction Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Transaction Type
          </label>
          <select
            value={filters.type}
            onChange={(e) =>
              updateFilter(
                "type",
                e.target.value as "ALL" | "INCOME" | "EXPENSE"
              )
            }
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="ALL">All Types</option>
            <option value="INCOME">Income</option>
            <option value="EXPENSE">Expense</option>
          </select>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category
          </label>
          <select
            value={filters.categoryId}
            onChange={(e) => updateFilter("categoryId", e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Categories</option>
            {getFilteredCategories().map((category) => (
              <option key={category.id} value={category.id}>
                {category.icon} {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* Sort By */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sort By
          </label>
          <div className="flex space-x-2">
            <select
              value={filters.sortBy}
              onChange={(e) =>
                updateFilter(
                  "sortBy",
                  e.target.value as "date" | "amount" | "description"
                )
              }
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="date">Date</option>
              <option value="amount">Amount</option>
              <option value="description">Description</option>
            </select>
            <select
              value={filters.sortOrder}
              onChange={(e) =>
                updateFilter("sortOrder", e.target.value as "asc" | "desc")
              }
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="desc">Desc</option>
              <option value="asc">Asc</option>
            </select>
          </div>
        </div>

        {/* Date Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <CalendarIcon className="h-4 w-4 inline mr-1" />
            Date Range
          </label>
          <div className="flex space-x-2">
            <input
              type="date"
              value={filters.dateRange.start}
              onChange={(e) => updateDateRange("start", e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Start date"
            />
            <input
              type="date"
              value={filters.dateRange.end}
              onChange={(e) => updateDateRange("end", e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="End date"
            />
          </div>
        </div>

        {/* Amount Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <CurrencyDollarIcon className="h-4 w-4 inline mr-1" />
            Amount Range
          </label>
          <div className="flex space-x-2">
            <input
              type="number"
              value={filters.amountRange.min}
              onChange={(e) => updateAmountRange("min", e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Min amount"
              min="0"
              step="0.01"
            />
            <input
              type="number"
              value={filters.amountRange.max}
              onChange={(e) => updateAmountRange("max", e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Max amount"
              min="0"
              step="0.01"
            />
          </div>
        </div>

        {/* Quick Date Filters */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quick Filters
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                const today = new Date();
                const startOfMonth = new Date(
                  today.getFullYear(),
                  today.getMonth(),
                  1
                );
                updateDateRange(
                  "start",
                  startOfMonth.toISOString().split("T")[0]
                );
                updateDateRange("end", today.toISOString().split("T")[0]);
              }}
              className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
            >
              This Month
            </button>
            <button
              onClick={() => {
                const today = new Date();
                const lastMonth = new Date(
                  today.getFullYear(),
                  today.getMonth() - 1,
                  1
                );
                const endOfLastMonth = new Date(
                  today.getFullYear(),
                  today.getMonth(),
                  0
                );
                updateDateRange("start", lastMonth.toISOString().split("T")[0]);
                updateDateRange(
                  "end",
                  endOfLastMonth.toISOString().split("T")[0]
                );
              }}
              className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
            >
              Last Month
            </button>
            <button
              onClick={() => {
                const today = new Date();
                const startOfYear = new Date(today.getFullYear(), 0, 1);
                updateDateRange(
                  "start",
                  startOfYear.toISOString().split("T")[0]
                );
                updateDateRange("end", today.toISOString().split("T")[0]);
              }}
              className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
            >
              This Year
            </button>
            <button
              onClick={() => {
                const today = new Date();
                const last30Days = new Date(
                  today.getTime() - 30 * 24 * 60 * 60 * 1000
                );
                updateDateRange(
                  "start",
                  last30Days.toISOString().split("T")[0]
                );
                updateDateRange("end", today.toISOString().split("T")[0]);
              }}
              className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
            >
              Last 30 Days
            </button>
          </div>
        </div>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters() && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            {filters.type !== "ALL" && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Type: {filters.type}
                <button
                  onClick={() => updateFilter("type", "ALL")}
                  className="ml-2 hover:text-blue-600"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            )}
            {filters.categoryId && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Category:{" "}
                {categories.find((c) => c.id === filters.categoryId)?.name}
                <button
                  onClick={() => updateFilter("categoryId", "")}
                  className="ml-2 hover:text-green-600"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            )}
            {filters.dateRange.start && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                Date: {filters.dateRange.start} -{" "}
                {filters.dateRange.end || "Now"}
                <button
                  onClick={() => updateDateRange("start", "")}
                  className="ml-2 hover:text-purple-600"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            )}
            {(filters.amountRange.min || filters.amountRange.max) && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                Amount: {filters.amountRange.min || "0"} -{" "}
                {filters.amountRange.max || "∞"}
                <button
                  onClick={() => {
                    updateAmountRange("min", "");
                    updateAmountRange("max", "");
                  }}
                  className="ml-2 hover:text-yellow-600"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
