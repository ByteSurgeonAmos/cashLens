"use client";

import React, { useState } from "react";
import { useCurrency } from "../../contexts/CurrencyContext";
import {
  XMarkIcon,
  DocumentArrowDownIcon,
  TableCellsIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon,
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

interface ExportModalProps {
  transactions: Transaction[];
  onClose: () => void;
}

type ExportFormat = "CSV" | "JSON" | "PDF";

export default function ExportModal({
  transactions,
  onClose,
}: ExportModalProps) {
  const { formatCurrency } = useCurrency();
  const [exportFormat, setExportFormat] = useState<ExportFormat>("CSV");
  const [dateRange, setDateRange] = useState({
    start: "",
    end: "",
  });
  const [includeCategories, setIncludeCategories] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const filteredTransactions = transactions.filter((transaction) => {
    if (!dateRange.start && !dateRange.end) return true;

    const transactionDate = new Date(transaction.date);
    const startDate = dateRange.start ? new Date(dateRange.start) : null;
    const endDate = dateRange.end ? new Date(dateRange.end) : null;

    if (startDate && transactionDate < startDate) return false;
    if (endDate && transactionDate > endDate) return false;

    return true;
  });

  const generateCSV = () => {
    const headers = [
      "Date",
      "Description",
      "Amount",
      "Type",
      ...(includeCategories ? ["Category"] : []),
      "Created At",
    ];

    const rows = filteredTransactions.map((transaction) => [
      new Date(transaction.date).toLocaleDateString(),
      `"${transaction.description.replace(/"/g, '""')}"`,
      transaction.amount,
      transaction.type,
      ...(includeCategories ? [`"${transaction.category.name}"`] : []),
      new Date(transaction.createdAt).toLocaleString(),
    ]);

    return [headers, ...rows].map((row) => row.join(",")).join("\n");
  };

  const generateJSON = () => {
    const data = filteredTransactions.map((transaction) => ({
      id: transaction.id,
      date: transaction.date,
      description: transaction.description,
      amount: transaction.amount,
      type: transaction.type,
      ...(includeCategories && {
        category: {
          id: transaction.category.id,
          name: transaction.category.name,
          icon: transaction.category.icon,
        },
      }),
      createdAt: transaction.createdAt,
    }));

    return JSON.stringify(
      {
        exportDate: new Date().toISOString(),
        totalTransactions: data.length,
        summary: {
          totalIncome: filteredTransactions
            .filter((t) => t.type === "INCOME")
            .reduce((sum, t) => sum + t.amount, 0),
          totalExpenses: filteredTransactions
            .filter((t) => t.type === "EXPENSE")
            .reduce((sum, t) => sum + t.amount, 0),
        },
        transactions: data,
      },
      null,
      2
    );
  };

  const generatePDF = async () => {
    // This would typically use a library like jsPDF or Puppeteer
    // For now, we'll create a formatted text version
    const content = `
TRANSACTION REPORT
Generated on: ${new Date().toLocaleDateString()}
Total Transactions: ${filteredTransactions.length}

SUMMARY
-------
Total Income: ${formatCurrency(
      filteredTransactions
        .filter((t) => t.type === "INCOME")
        .reduce((sum, t) => sum + t.amount, 0)
    )}
Total Expenses: ${formatCurrency(
      filteredTransactions
        .filter((t) => t.type === "EXPENSE")
        .reduce((sum, t) => sum + t.amount, 0)
    )}
Net Balance: ${formatCurrency(
      filteredTransactions.reduce(
        (sum, t) => sum + (t.type === "INCOME" ? t.amount : -t.amount),
        0
      )
    )}

TRANSACTIONS
------------
${filteredTransactions
  .map(
    (transaction) =>
      `${new Date(transaction.date).toLocaleDateString()} | ${
        transaction.description
      } | ${transaction.type === "INCOME" ? "+" : "-"}${formatCurrency(
        transaction.amount
      )} | ${includeCategories ? transaction.category.name : ""}`
  )
  .join("\n")}
    `;

    return content;
  };

  const handleExport = async () => {
    setIsExporting(true);

    try {
      let content: string;
      let filename: string;
      let mimeType: string;

      switch (exportFormat) {
        case "CSV":
          content = generateCSV();
          filename = `transactions_${
            new Date().toISOString().split("T")[0]
          }.csv`;
          mimeType = "text/csv";
          break;
        case "JSON":
          content = generateJSON();
          filename = `transactions_${
            new Date().toISOString().split("T")[0]
          }.json`;
          mimeType = "application/json";
          break;
        case "PDF":
          content = await generatePDF();
          filename = `transactions_${
            new Date().toISOString().split("T")[0]
          }.txt`;
          mimeType = "text/plain";
          break;
        default:
          throw new Error("Invalid export format");
      }

      const blob = new Blob([content], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      onClose();
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const exportOptions = [
    {
      format: "CSV" as ExportFormat,
      title: "CSV File",
      description: "Comma-separated values for spreadsheet applications",
      icon: TableCellsIcon,
    },
    {
      format: "JSON" as ExportFormat,
      title: "JSON File",
      description: "Machine-readable format with complete data structure",
      icon: DocumentTextIcon,
    },
    {
      format: "PDF" as ExportFormat,
      title: "Text Report",
      description: "Human-readable report format",
      icon: DocumentArrowDownIcon,
    },
  ];

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Export Transactions
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Export Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Export Format
            </label>
            <div className="grid grid-cols-1 gap-3">
              {exportOptions.map((option) => (
                <label key={option.format} className="relative">
                  <input
                    type="radio"
                    name="exportFormat"
                    value={option.format}
                    checked={exportFormat === option.format}
                    onChange={(e) =>
                      setExportFormat(e.target.value as ExportFormat)
                    }
                    className="sr-only"
                  />
                  <div
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      exportFormat === option.format
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    <div className="flex items-center">
                      <option.icon className="h-6 w-6 text-gray-600 mr-3" />
                      <div>
                        <div className="font-medium text-gray-900">
                          {option.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          {option.description}
                        </div>
                      </div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Date Range Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Date Range (Optional)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">From</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, start: e.target.value })
                  }
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">To</label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, end: e.target.value })
                  }
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Export Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Export Options
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={includeCategories}
                  onChange={(e) => setIncludeCategories(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Include category information
                </span>
              </label>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">
              Export Preview
            </h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p>Total transactions: {filteredTransactions.length}</p>
              <p>
                Date range:{" "}
                {dateRange.start || dateRange.end
                  ? `${dateRange.start || "Beginning"} to ${
                      dateRange.end || "Now"
                    }`
                  : "All dates"}
              </p>
              <p>Format: {exportFormat}</p>
              <p>Include categories: {includeCategories ? "Yes" : "No"}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting || filteredTransactions.length === 0}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Exporting...
                </>
              ) : (
                <>
                  <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                  Export {filteredTransactions.length} Transactions
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
