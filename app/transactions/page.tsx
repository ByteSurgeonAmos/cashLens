"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_TRANSACTIONS_QUERY,
  GET_CATEGORIES_QUERY,
  DELETE_TRANSACTION_MUTATION,
} from "../../lib/graphql/queries";
import { useCurrency } from "../../contexts/CurrencyContext";
import { Layout } from "../../components/layout/Layout";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { ConfirmationModal } from "../../components/ui/ConfirmationModal";
import TransactionModal from "../../components/transactions/TransactionModal";
import TransactionFilters from "../../components/transactions/TransactionFilters";
import TransactionList from "../../components/transactions/TransactionList";
import TransactionStats from "../../components/transactions/TransactionStats";
import ExportModal from "../../components/transactions/ExportModal";
import TransactionAnalytics from "../../components/transactions/TransactionAnalytics";
import BulkActions from "../../components/transactions/BulkActions";
import QuickAddTransaction from "../../components/transactions/QuickAddTransaction";
import {
  PlusIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  ChartBarIcon,
  CheckIcon,
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

const ITEMS_PER_PAGE = 20;

export default function TransactionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { formatCurrency } = useCurrency();

  // State management
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [deletingTransaction, setDeletingTransaction] =
    useState<Transaction | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>(
    []
  );
  const [showBulkActions, setShowBulkActions] = useState(false);

  const [filters, setFilters] = useState<FilterState>({
    type: "ALL",
    categoryId: "",
    dateRange: {
      start: "",
      end: "",
    },
    amountRange: {
      min: "",
      max: "",
    },
    sortBy: "date",
    sortOrder: "desc",
    search: "",
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  // GraphQL queries
  const {
    data: transactionsData,
    loading: transactionsLoading,
    error: transactionsError,
    refetch: refetchTransactions,
  } = useQuery(GET_TRANSACTIONS_QUERY, {
    variables: {
      limit: ITEMS_PER_PAGE * 10, // Load more for client-side filtering
      offset: 0,
      type: filters.type === "ALL" ? null : filters.type,
    },
    skip: !session,
    fetchPolicy: "cache-and-network",
  });

  const { data: categoriesData, loading: categoriesLoading } = useQuery(
    GET_CATEGORIES_QUERY,
    {
      skip: !session,
    }
  );

  const [deleteTransaction] = useMutation(DELETE_TRANSACTION_MUTATION, {
    onCompleted: () => {
      refetchTransactions();
      setDeletingTransaction(null);
    },
    onError: (error) => {
      console.error("Error deleting transaction:", error);
    },
  });

  // Filter and sort transactions
  const filteredTransactions = useMemo(() => {
    if (!transactionsData?.transactions) return [];

    let filtered = [...transactionsData.transactions];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (transaction) =>
          transaction.description.toLowerCase().includes(searchLower) ||
          transaction.category.name.toLowerCase().includes(searchLower)
      );
    }

    // Category filter
    if (filters.categoryId) {
      filtered = filtered.filter(
        (transaction) => transaction.category.id === filters.categoryId
      );
    }

    // Date range filter
    if (filters.dateRange.start) {
      filtered = filtered.filter(
        (transaction) =>
          new Date(transaction.date) >= new Date(filters.dateRange.start)
      );
    }
    if (filters.dateRange.end) {
      filtered = filtered.filter(
        (transaction) =>
          new Date(transaction.date) <= new Date(filters.dateRange.end)
      );
    }

    // Amount range filter
    if (filters.amountRange.min) {
      filtered = filtered.filter(
        (transaction) =>
          transaction.amount >= parseFloat(filters.amountRange.min)
      );
    }
    if (filters.amountRange.max) {
      filtered = filtered.filter(
        (transaction) =>
          transaction.amount <= parseFloat(filters.amountRange.max)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (filters.sortBy) {
        case "date":
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case "amount":
          comparison = a.amount - b.amount;
          break;
        case "description":
          comparison = a.description.localeCompare(b.description);
          break;
        default:
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      }

      return filters.sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [transactionsData?.transactions, filters]);

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setShowTransactionModal(true);
  };

  const handleDeleteTransaction = async () => {
    if (!deletingTransaction) return;

    try {
      await deleteTransaction({
        variables: { id: deletingTransaction.id },
      });
    } catch (error) {
      console.error("Error deleting transaction:", error);
    }
  };

  const resetFilters = () => {
    setFilters({
      type: "ALL",
      categoryId: "",
      dateRange: { start: "", end: "" },
      amountRange: { min: "", max: "" },
      sortBy: "date",
      sortOrder: "desc",
      search: "",
    });
    setCurrentPage(1);
  };

  if (status === "loading" || transactionsLoading || categoriesLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  if (transactionsError) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Error Loading Transactions
            </h1>
            <p className="text-gray-600">{transactionsError.message}</p>
            <button
              onClick={() => refetchTransactions()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
            <p className="text-gray-600 mt-2">
              Manage and track all your financial transactions
            </p>
          </div>
          <div className="flex items-center space-x-3 mt-4 sm:mt-0">
            <button
              onClick={() => setShowAnalytics(!showAnalytics)}
              className={`inline-flex items-center px-4 py-2 border rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                showAnalytics
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
              }`}
            >
              <ChartBarIcon className="h-4 w-4 mr-2" />
              Analytics
            </button>
            <button
              onClick={() => setShowBulkActions(!showBulkActions)}
              className={`inline-flex items-center px-4 py-2 border rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                showBulkActions
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
              }`}
            >
              <CheckIcon className="h-4 w-4 mr-2" />
              Select
            </button>
            <button
              onClick={() => setShowExportModal(true)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              Export
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <AdjustmentsHorizontalIcon className="h-4 w-4 mr-2" />
              Filters
            </button>
            <button
              onClick={() => {
                setEditingTransaction(null);
                setShowTransactionModal(true);
              }}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Transaction
            </button>
          </div>
        </div>

        {/* Statistics */}
        <TransactionStats transactions={filteredTransactions} />

        {/* Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            placeholder="Search transactions by description or category..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Filters */}
        {showFilters && (
          <TransactionFilters
            filters={filters}
            setFilters={setFilters}
            categories={categoriesData?.categories || []}
            onReset={resetFilters}
          />
        )}

        {/* Transaction List */}
        <div className="bg-white shadow-sm rounded-lg">
          <TransactionList
            transactions={paginatedTransactions}
            onEdit={handleEditTransaction}
            onDelete={setDeletingTransaction}
            loading={transactionsLoading}
            selectedTransactions={selectedTransactions}
            onSelectionChange={setSelectedTransactions}
            showSelection={showBulkActions}
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
                  {Math.min(
                    currentPage * ITEMS_PER_PAGE,
                    filteredTransactions.length
                  )}{" "}
                  of {filteredTransactions.length} transactions
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-700">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Analytics */}
        {showAnalytics && (
          <TransactionAnalytics transactions={filteredTransactions} />
        )}

        {/* No transactions message */}
        {filteredTransactions.length === 0 && !transactionsLoading && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">💸</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No transactions found
            </h3>
            <p className="text-gray-500 mb-6">
              {filters.search ||
              filters.categoryId ||
              filters.dateRange.start ||
              filters.amountRange.min
                ? "Try adjusting your filters or search terms."
                : "Get started by adding your first transaction."}
            </p>
            {!filters.search &&
              !filters.categoryId &&
              !filters.dateRange.start &&
              !filters.amountRange.min && (
                <button
                  onClick={() => {
                    setEditingTransaction(null);
                    setShowTransactionModal(true);
                  }}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Your First Transaction
                </button>
              )}
          </div>
        )}
      </div>

      {/* Modals */}
      {showTransactionModal && (
        <TransactionModal
          transaction={editingTransaction}
          categories={categoriesData?.categories || []}
          onClose={() => {
            setShowTransactionModal(false);
            setEditingTransaction(null);
          }}
          onSuccess={() => {
            refetchTransactions();
            setShowTransactionModal(false);
            setEditingTransaction(null);
          }}
        />
      )}

      {showExportModal && (
        <ExportModal
          transactions={filteredTransactions}
          onClose={() => setShowExportModal(false)}
        />
      )}

      {deletingTransaction && (
        <ConfirmationModal
          isOpen={true}
          title="Delete Transaction"
          message={`Are you sure you want to delete the transaction "${deletingTransaction.description}"? This action cannot be undone.`}
          confirmText="Delete"
          onConfirm={handleDeleteTransaction}
          onClose={() => setDeletingTransaction(null)}
          confirmButtonStyle="danger"
        />
      )}

      {/* Bulk Actions */}
      {showBulkActions && (
        <BulkActions
          selectedTransactions={selectedTransactions}
          transactions={paginatedTransactions}
          categories={categoriesData?.categories || []}
          onSelectionChange={setSelectedTransactions}
          onRefresh={refetchTransactions}
        />
      )}

      {/* Quick Add Transaction (Floating) */}
      <QuickAddTransaction
        categories={categoriesData?.categories || []}
        onSuccess={refetchTransactions}
      />
    </Layout>
  );
}
