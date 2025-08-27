"use client";

import React from "react";
import { useCurrency } from "../../contexts/CurrencyContext";
import {
  ArrowUpIcon,
  ArrowDownIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
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

interface TransactionStatsProps {
  transactions: Transaction[];
}

export default function TransactionStats({
  transactions,
}: TransactionStatsProps) {
  const { formatCurrency } = useCurrency();

  const stats = React.useMemo(() => {
    const income = transactions
      .filter((t) => t.type === "INCOME")
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = transactions
      .filter((t) => t.type === "EXPENSE")
      .reduce((sum, t) => sum + t.amount, 0);

    const balance = income - expenses;

    const totalTransactions = transactions.length;
    const incomeTransactions = transactions.filter(
      (t) => t.type === "INCOME"
    ).length;
    const expenseTransactions = transactions.filter(
      (t) => t.type === "EXPENSE"
    ).length;

    const avgIncome = incomeTransactions > 0 ? income / incomeTransactions : 0;
    const avgExpense =
      expenseTransactions > 0 ? expenses / expenseTransactions : 0;

    // Get current month stats for comparison
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const currentMonthTransactions = transactions.filter((t) => {
      const date = new Date(t.date);
      return (
        date.getMonth() === currentMonth && date.getFullYear() === currentYear
      );
    });

    const currentMonthIncome = currentMonthTransactions
      .filter((t) => t.type === "INCOME")
      .reduce((sum, t) => sum + t.amount, 0);

    const currentMonthExpenses = currentMonthTransactions
      .filter((t) => t.type === "EXPENSE")
      .reduce((sum, t) => sum + t.amount, 0);

    // Get most used category
    const categoryUsage = transactions.reduce((acc, transaction) => {
      const categoryId = transaction.category.id;
      acc[categoryId] = (acc[categoryId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostUsedCategory = transactions.find(
      (t) =>
        t.category.id ===
        Object.keys(categoryUsage).reduce(
          (a, b) => ((categoryUsage[a] || 0) > (categoryUsage[b] || 0) ? a : b),
          ""
        )
    )?.category;

    return {
      income,
      expenses,
      balance,
      totalTransactions,
      avgIncome,
      avgExpense,
      currentMonthIncome,
      currentMonthExpenses,
      mostUsedCategory,
    };
  }, [transactions]);

  const statCards = [
    {
      title: "Total Income",
      value: formatCurrency(stats.income),
      icon: ArrowUpIcon,
      iconColor: "text-green-600",
      bgColor: "bg-green-50",
      change:
        stats.currentMonthIncome > 0
          ? `${formatCurrency(stats.currentMonthIncome)} this month`
          : null,
    },
    {
      title: "Total Expenses",
      value: formatCurrency(stats.expenses),
      icon: ArrowDownIcon,
      iconColor: "text-red-600",
      bgColor: "bg-red-50",
      change:
        stats.currentMonthExpenses > 0
          ? `${formatCurrency(stats.currentMonthExpenses)} this month`
          : null,
    },
    {
      title: "Net Balance",
      value: formatCurrency(stats.balance),
      icon: CurrencyDollarIcon,
      iconColor: stats.balance >= 0 ? "text-green-600" : "text-red-600",
      bgColor: stats.balance >= 0 ? "bg-green-50" : "bg-red-50",
      change: `${stats.totalTransactions} transactions`,
    },
    {
      title: "Average Transaction",
      value: formatCurrency(
        (stats.income + stats.expenses) / (stats.totalTransactions || 1)
      ),
      icon: ChartBarIcon,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-50",
      change: stats.mostUsedCategory
        ? `Most used: ${stats.mostUsedCategory.name}`
        : null,
    },
  ];

  if (transactions.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat, index) => (
        <div
          key={index}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center">
            <div className={`${stat.bgColor} p-3 rounded-full`}>
              <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-sm font-medium text-gray-900">
                {stat.title}
              </h3>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stat.value}
              </p>
              {stat.change && (
                <p className="text-sm text-gray-600 mt-1">{stat.change}</p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
