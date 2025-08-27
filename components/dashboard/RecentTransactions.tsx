"use client";

import { memo } from "react";
import { useQuery } from "@apollo/client";
import { GET_TRANSACTIONS_QUERY } from "../../lib/graphql/queries";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import { useCurrency } from "../../contexts/CurrencyContext";

export const RecentTransactions = memo(function RecentTransactions() {
  const { formatCurrency } = useCurrency();
  const { data, loading, error } = useQuery(GET_TRANSACTIONS_QUERY, {
    variables: { limit: 5 },
    fetchPolicy: "cache-first", // Use cached data when available
    nextFetchPolicy: "cache-only", // After first fetch, only use cache
    notifyOnNetworkStatusChange: false, // Reduce re-renders
    errorPolicy: "ignore", // Don't trigger re-renders on errors
    pollInterval: 0, // Disable polling to prevent auto-refresh
  });

  if (loading) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Transactions
        </h3>
        <div className="flex items-center justify-center h-40">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Transactions
        </h3>
        <div className="text-center text-red-500">
          Error loading transactions
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Recent Transactions
        </h3>
        <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
          View all
        </button>
      </div>

      <div className="space-y-3">
        {data?.transactions?.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <div className="text-4xl mb-2">💸</div>
            <p>No transactions yet</p>
            <p className="text-sm">Add your first transaction to get started</p>
          </div>
        ) : (
          data?.transactions?.map((transaction: any) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0"
            >
              <div className="flex items-center space-x-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: transaction.category.color + "20" }}
                >
                  <span className="text-lg">{transaction.category.icon}</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {transaction.description}
                  </p>
                  <p className="text-sm text-gray-500">
                    {transaction.category.name} • {formatDate(transaction.date)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p
                  className={`font-semibold ${
                    transaction.type === "INCOME"
                      ? "text-success-600"
                      : "text-danger-600"
                  }`}
                >
                  {transaction.type === "INCOME" ? "+" : "-"}
                  {formatCurrency(Math.abs(transaction.amount))}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
});
