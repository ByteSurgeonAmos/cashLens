"use client";

import { useQuery } from "@apollo/client";
import { useSession } from "next-auth/react";
import { useCurrency } from "../../contexts/CurrencyContext";
import { DASHBOARD_STATS_COMPARISON_QUERY } from "../../lib/graphql/queries";

interface StatsCardsProps {
  loading?: boolean;
}

export function StatsCards({ loading: externalLoading }: StatsCardsProps) {
  const { formatCurrency } = useCurrency();
  const { status } = useSession();

  const { data, loading, error } = useQuery(DASHBOARD_STATS_COMPARISON_QUERY, {
    skip: status !== "authenticated",
    fetchPolicy: "cache-first", // Use cached data when available
    nextFetchPolicy: "cache-only", // After first fetch, only use cache
    notifyOnNetworkStatusChange: false,
    errorPolicy: "ignore",
    pollInterval: 0, // Disable polling to prevent auto-refresh
  });

  const formatPercentageChange = (change: number) => {
    const sign = change >= 0 ? "+" : "";
    return `${sign}${change.toFixed(1)}%`;
  };

  const getChangeColor = (change: number, isExpense = false) => {
    if (change === 0) return "text-white/60";
    const isPositive = isExpense ? change < 0 : change > 0;
    return isPositive ? "text-green-300" : "text-red-300";
  };

  const getBalanceDisplay = (balance: number) => {
    if (balance === 0) return "●";
    return balance > 0 ? "↗" : "↘";
  };

  const getBalanceColor = (balance: number) => {
    if (balance === 0) return "text-white/60";
    return balance > 0 ? "text-green-300" : "text-red-300";
  };

  if ((loading || externalLoading) && !data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card animate-pulse">
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card text-center text-red-500">Error loading stats</div>
      </div>
    );
  }

  const stats = data?.dashboardStatsComparison?.current;
  const comparison = data?.dashboardStatsComparison;

  const cards = [
    {
      title: "Total Income",
      value: formatCurrency(stats?.totalIncome || 0),
      icon: "📈",
      color: "income-card",
      change:
        comparison?.incomeChange !== undefined
          ? formatPercentageChange(comparison.incomeChange)
          : "●",
      changeColor:
        comparison?.incomeChange !== undefined
          ? getChangeColor(comparison.incomeChange)
          : "text-white/60",
    },
    {
      title: "Total Expenses",
      value: formatCurrency(stats?.totalExpenses || 0),
      icon: "📉",
      color: "expense-card",
      change:
        comparison?.expensesChange !== undefined
          ? formatPercentageChange(comparison.expensesChange)
          : "●",
      changeColor:
        comparison?.expensesChange !== undefined
          ? getChangeColor(comparison.expensesChange, true) // true for expense
          : "text-white/60",
    },
    {
      title: "Balance",
      value: formatCurrency(stats?.balance || 0),
      icon: "💰",
      color: "stat-card",
      change:
        comparison?.balanceChange !== undefined
          ? formatPercentageChange(comparison.balanceChange)
          : getBalanceDisplay(stats?.balance || 0),
      changeColor:
        comparison?.balanceChange !== undefined
          ? getChangeColor(comparison.balanceChange)
          : getBalanceColor(stats?.balance || 0),
    },
    {
      title: "Transactions",
      value: stats?.transactionCount?.toString() || "0",
      icon: "🔄",
      color: "stat-card",
      change:
        comparison?.transactionCountChange !== undefined
          ? `${comparison.transactionCountChange >= 0 ? "+" : ""}${
              comparison.transactionCountChange
            } from last month`
          : `${stats?.categoriesCount || 0} categories`,
      changeColor:
        comparison?.transactionCountChange !== undefined
          ? getChangeColor(comparison.transactionCountChange)
          : "text-white/60",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <div key={index} className={`${card.color} animate-fade-in`}>
          <div className="flex items-start justify-between">
            <div className="w-full">
              <p className="text-white/80 text-sm font-medium mb-1">
                {card.title}
              </p>
              <p className="text-2xl font-bold text-white mb-2">{card.value}</p>
              <p
                className={`text-sm font-medium ${
                  card.changeColor || "text-white/60"
                }`}
              >
                {card.change}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
