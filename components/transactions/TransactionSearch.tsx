"use client";

import React, { useState, useEffect } from "react";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: "INCOME" | "EXPENSE";
}

interface SearchFilters {
  search: string;
  type: "ALL" | "INCOME" | "EXPENSE";
  categoryId: string;
  amountMin: string;
  amountMax: string;
  dateFrom: string;
  dateTo: string;
}

interface TransactionSearchProps {
  categories: Category[];
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onClearFilters: () => void;
}

export default function TransactionSearch({
  categories,
  filters,
  onFiltersChange,
  onClearFilters,
}: TransactionSearchProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onFiltersChange(localFilters);
    }, 300); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [localFilters, onFiltersChange]);

  const updateFilter = (key: keyof SearchFilters, value: string) => {
    setLocalFilters((prev) => ({ ...prev, [key]: value }));
  };

  const hasActiveFilters = () => {
    return (
      filters.search !== "" ||
      filters.type !== "ALL" ||
      filters.categoryId !== "" ||
      filters.amountMin !== "" ||
      filters.amountMax !== "" ||
      filters.dateFrom !== "" ||
      filters.dateTo !== ""
    );
  };

  const filteredCategories = categories.filter(
    (cat) => filters.type === "ALL" || cat.type === filters.type
  );

  return (
    <div className="space-y-4">
      {/* Main Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={localFilters.search}
          onChange={(e) => updateFilter("search", e.target.value)}
          placeholder="Search transactions by description, category, or amount..."
          className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center space-x-2">
          {hasActiveFilters() && (
            <button
              onClick={onClearFilters}
              className="text-gray-400 hover:text-gray-600"
              title="Clear all filters"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          )}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`p-1 rounded ${
              showAdvanced
                ? "text-blue-600 bg-blue-50"
                : "text-gray-400 hover:text-gray-600"
            }`}
            title="Advanced filters"
          >
            <FunnelIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
          <h4 className="text-sm font-medium text-gray-900">
            Advanced Filters
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Transaction Type */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                value={localFilters.type}
                onChange={(e) =>
                  updateFilter(
                    "type",
                    e.target.value as "ALL" | "INCOME" | "EXPENSE"
                  )
                }
                className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="ALL">All Types</option>
                <option value="INCOME">Income</option>
                <option value="EXPENSE">Expense</option>
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={localFilters.categoryId}
                onChange={(e) => updateFilter("categoryId", e.target.value)}
                className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Categories</option>
                {filteredCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Amount Range */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Amount Range
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  value={localFilters.amountMin}
                  onChange={(e) => updateFilter("amountMin", e.target.value)}
                  placeholder="Min"
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  step="0.01"
                  min="0"
                />
                <input
                  type="number"
                  value={localFilters.amountMax}
                  onChange={(e) => updateFilter("amountMax", e.target.value)}
                  placeholder="Max"
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Date From
              </label>
              <input
                type="date"
                value={localFilters.dateFrom}
                onChange={(e) => updateFilter("dateFrom", e.target.value)}
                className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Date To
              </label>
              <input
                type="date"
                value={localFilters.dateTo}
                onChange={(e) => updateFilter("dateTo", e.target.value)}
                className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Quick Date Filters */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Quick Dates
              </label>
              <div className="flex flex-wrap gap-1">
                <button
                  onClick={() => {
                    const today = new Date();
                    const startOfMonth = new Date(
                      today.getFullYear(),
                      today.getMonth(),
                      1
                    );
                    updateFilter(
                      "dateFrom",
                      startOfMonth.toISOString().split("T")[0]
                    );
                    updateFilter("dateTo", today.toISOString().split("T")[0]);
                  }}
                  className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
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
                    updateFilter(
                      "dateFrom",
                      lastMonth.toISOString().split("T")[0]
                    );
                    updateFilter(
                      "dateTo",
                      endOfLastMonth.toISOString().split("T")[0]
                    );
                  }}
                  className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                >
                  Last Month
                </button>
                <button
                  onClick={() => {
                    const today = new Date();
                    const last30Days = new Date(
                      today.getTime() - 30 * 24 * 60 * 60 * 1000
                    );
                    updateFilter(
                      "dateFrom",
                      last30Days.toISOString().split("T")[0]
                    );
                    updateFilter("dateTo", today.toISOString().split("T")[0]);
                  }}
                  className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                >
                  Last 30 Days
                </button>
              </div>
            </div>
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters() && (
            <div className="border-t border-gray-200 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-700">
                  Active Filters:
                </span>
                <button
                  onClick={onClearFilters}
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  Clear All
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {filters.type !== "ALL" && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Type: {filters.type}
                  </span>
                )}
                {filters.categoryId && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Category:{" "}
                    {categories.find((c) => c.id === filters.categoryId)?.name}
                  </span>
                )}
                {(filters.amountMin || filters.amountMax) && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Amount: {filters.amountMin || "0"} -{" "}
                    {filters.amountMax || "∞"}
                  </span>
                )}
                {(filters.dateFrom || filters.dateTo) && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    Date: {filters.dateFrom || "Start"} -{" "}
                    {filters.dateTo || "End"}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
