"use client";

import React, { useMemo } from "react";
import { useCurrency } from "../../contexts/CurrencyContext";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachMonthOfInterval,
  subMonths,
} from "date-fns";
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChartBarIcon,
  CalendarIcon,
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

interface TransactionAnalyticsProps {
  transactions: Transaction[];
}

interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
  net: number;
}

interface CategoryData {
  category: Transaction["category"];
  totalAmount: number;
  transactionCount: number;
  percentage: number;
}

export default function TransactionAnalytics({
  transactions,
}: TransactionAnalyticsProps) {
  const { formatCurrency } = useCurrency();

  const analytics = useMemo(() => {
    if (transactions.length === 0) return null;

    // Calculate monthly trends for the last 6 months
    const sixMonthsAgo = subMonths(new Date(), 5);
    const monthsInterval = eachMonthOfInterval({
      start: startOfMonth(sixMonthsAgo),
      end: endOfMonth(new Date()),
    });

    const monthlyData: MonthlyData[] = monthsInterval.map((month) => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);

      const monthTransactions = transactions.filter((t) => {
        const transactionDate = new Date(t.date);
        return transactionDate >= monthStart && transactionDate <= monthEnd;
      });

      const income = monthTransactions
        .filter((t) => t.type === "INCOME")
        .reduce((sum, t) => sum + t.amount, 0);

      const expenses = monthTransactions
        .filter((t) => t.type === "EXPENSE")
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        month: format(month, "MMM yyyy"),
        income,
        expenses,
        net: income - expenses,
      };
    });

    // Calculate category breakdown for expenses
    const expenseTransactions = transactions.filter(
      (t) => t.type === "EXPENSE"
    );
    const totalExpenses = expenseTransactions.reduce(
      (sum, t) => sum + t.amount,
      0
    );

    const categoryTotals = expenseTransactions.reduce((acc, transaction) => {
      const categoryId = transaction.category.id;
      if (!acc[categoryId]) {
        acc[categoryId] = {
          category: transaction.category,
          totalAmount: 0,
          transactionCount: 0,
        };
      }
      acc[categoryId].totalAmount += transaction.amount;
      acc[categoryId].transactionCount += 1;
      return acc;
    }, {} as Record<string, Omit<CategoryData, "percentage">>);

    const topExpenseCategories: CategoryData[] = Object.values(categoryTotals)
      .map((cat) => ({
        ...cat,
        percentage:
          totalExpenses > 0 ? (cat.totalAmount / totalExpenses) * 100 : 0,
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 5);

    // Calculate trends
    const currentMonth = monthlyData[monthlyData.length - 1];
    const previousMonth = monthlyData[monthlyData.length - 2];

    const incomeChange = previousMonth
      ? ((currentMonth.income - previousMonth.income) /
          (previousMonth.income || 1)) *
        100
      : 0;

    const expenseChange = previousMonth
      ? ((currentMonth.expenses - previousMonth.expenses) /
          (previousMonth.expenses || 1)) *
        100
      : 0;

    // Calculate spending patterns
    const dailyAverage =
      totalExpenses /
      Math.max(
        1,
        Math.ceil(
          (new Date().getTime() -
            new Date(
              transactions[transactions.length - 1]?.date || new Date()
            ).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      );

    const weeklyAverage = dailyAverage * 7;
    const monthlyAverage = dailyAverage * 30;

    return {
      monthlyData,
      topExpenseCategories,
      trends: {
        incomeChange,
        expenseChange,
      },
      averages: {
        daily: dailyAverage,
        weekly: weeklyAverage,
        monthly: monthlyAverage,
      },
    };
  }, [transactions]);

  if (!analytics || transactions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Transaction Analytics
        </h3>
        <div className="text-center py-8">
          <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">
            Add some transactions to see analytics
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Trends Summary */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Monthly Trends
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center">
            <div
              className={`p-3 rounded-full ${
                analytics.trends.incomeChange >= 0
                  ? "bg-green-100"
                  : "bg-red-100"
              }`}
            >
              {analytics.trends.incomeChange >= 0 ? (
                <ArrowTrendingUpIcon className="h-6 w-6 text-green-600" />
              ) : (
                <ArrowTrendingDownIcon className="h-6 w-6 text-red-600" />
              )}
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Income Change</p>
              <p
                className={`text-lg font-semibold ${
                  analytics.trends.incomeChange >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {analytics.trends.incomeChange >= 0 ? "+" : ""}
                {analytics.trends.incomeChange.toFixed(1)}%
              </p>
            </div>
          </div>

          <div className="flex items-center">
            <div
              className={`p-3 rounded-full ${
                analytics.trends.expenseChange <= 0
                  ? "bg-green-100"
                  : "bg-red-100"
              }`}
            >
              {analytics.trends.expenseChange <= 0 ? (
                <ArrowTrendingDownIcon className="h-6 w-6 text-green-600" />
              ) : (
                <ArrowTrendingUpIcon className="h-6 w-6 text-red-600" />
              )}
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Expense Change</p>
              <p
                className={`text-lg font-semibold ${
                  analytics.trends.expenseChange <= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {analytics.trends.expenseChange >= 0 ? "+" : ""}
                {analytics.trends.expenseChange.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          6-Month Overview
        </h3>
        <div className="space-y-4">
          {analytics.monthlyData.map((month, index) => {
            const maxAmount = Math.max(
              ...analytics.monthlyData.map((m) =>
                Math.max(m.income, m.expenses)
              )
            );
            const incomeWidth =
              maxAmount > 0 ? (month.income / maxAmount) * 100 : 0;
            const expenseWidth =
              maxAmount > 0 ? (month.expenses / maxAmount) * 100 : 0;

            return (
              <div key={month.month} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">
                    {month.month}
                  </span>
                  <span
                    className={`text-sm font-medium ${
                      month.net >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    Net: {formatCurrency(month.net)}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center text-xs text-gray-600">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    Income: {formatCurrency(month.income)}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${incomeWidth}%` }}
                    ></div>
                  </div>
                  <div className="flex items-center text-xs text-gray-600">
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                    Expenses: {formatCurrency(month.expenses)}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-red-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${expenseWidth}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Categories */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Top Expense Categories
        </h3>
        <div className="space-y-4">
          {analytics.topExpenseCategories.map((categoryData, index) => (
            <div
              key={categoryData.category.id}
              className="flex items-center justify-between"
            >
              <div className="flex items-center flex-1">
                <div
                  className="flex items-center justify-center w-8 h-8 rounded-full text-white text-sm mr-3"
                  style={{ backgroundColor: categoryData.category.color }}
                >
                  {categoryData.category.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900">
                      {categoryData.category.name}
                    </span>
                    <span className="text-sm text-gray-600">
                      {categoryData.percentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${categoryData.percentage}%`,
                        backgroundColor: categoryData.category.color,
                      }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-500">
                      {categoryData.transactionCount} transactions
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatCurrency(categoryData.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Spending Averages */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Spending Averages
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(analytics.averages.daily)}
            </div>
            <div className="text-sm text-gray-600">Daily Average</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(analytics.averages.weekly)}
            </div>
            <div className="text-sm text-gray-600">Weekly Average</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(analytics.averages.monthly)}
            </div>
            <div className="text-sm text-gray-600">Monthly Average</div>
          </div>
        </div>
      </div>
    </div>
  );
}
