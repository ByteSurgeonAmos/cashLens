"use client";

import React, { useMemo } from "react";
import { useSession } from "next-auth/react";
import { useQuery } from "@apollo/client";
import {
  GET_TRANSACTION_STATS_QUERY,
  MONTHLY_DATA_QUERY,
  GET_CATEGORIES_QUERY,
  GET_BUDGETS_QUERY,
  GET_TRANSACTIONS_QUERY,
} from "../../lib/graphql/queries";
import { useCurrency } from "../../contexts/CurrencyContext";
import { Layout } from "../../components/layout/Layout";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { MonthlyChart } from "../../components/dashboard/MonthlyChart";
import TransactionAnalytics from "../../components/transactions/TransactionAnalytics";
import TransactionStats from "../../components/transactions/TransactionStats";
import { CategorySpendingPieChart } from "../../components/dashboard/CategorySpendingPieChart";

export default function ReportsPage() {
  const { data: session, status } = useSession();
  const { formatCurrencySymbol } = useCurrency();
  const currentYear = useMemo(() => new Date().getFullYear(), []);

  //   const { data: transactionStatsData, loading: transactionStatsLoading } =
  //     useQuery(GET_TRANSACTION_STATS_QUERY, {
  //       skip: !session,
  //       fetchPolicy: "cache-first",
  //       nextFetchPolicy: "cache-only",
  //       notifyOnNetworkStatusChange: false,
  //       errorPolicy: "ignore",
  //       pollInterval: 0,
  //     });

  //   const { data: dashboardStatsData, loading: dashboardStatsLoading } = useQuery(
  //     DASHBOARD_STATS_QUERY,
  //     {
  //       skip: !session,
  //     }
  //   );

  //   const { data: dashboardComparisonData, loading: dashboardComparisonLoading } =
  //     useQuery(DASHBOARD_STATS_COMPARISON_QUERY, {
  //       skip: !session,
  //     });

  const { data: monthlyData, loading: monthlyLoading } = useQuery(
    MONTHLY_DATA_QUERY,
    {
      variables: { year: currentYear },
      skip: !session,
      fetchPolicy: "cache-first",
      nextFetchPolicy: "cache-only",
      notifyOnNetworkStatusChange: false,
      errorPolicy: "ignore",
      pollInterval: 0,
    }
  );

  //   const { data: categoriesData, loading: categoriesLoading } = useQuery(
  //     GET_CATEGORIES_QUERY,
  //     {
  //       skip: !session,
  //     }
  //   );

  const { data: budgetsData, loading: budgetsLoading } = useQuery(
    GET_BUDGETS_QUERY,
    {
      skip: !session,
    }
  );

  const { data: transactionsData, loading: transactionsLoading } = useQuery(
    GET_TRANSACTIONS_QUERY,
    {
      variables: { limit: 100 },
      skip: !session,
    }
  );

  const isLoading = monthlyLoading || budgetsLoading || transactionsLoading;

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <Layout>
      <div className="max-w-[2000px] mx-auto space-y-8 py-8">
        <h1 className="text-3xl font-bold mb-6">Reports & Analytics</h1>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">
            Category Spending Breakdown
          </h2>
          <div className="w-full md:w-1/2 mx-auto">
            {transactionsData?.transactions &&
            transactionsData.transactions.length > 0 ? (
              <CategorySpendingPieChart
                transactions={transactionsData.transactions}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <span className="text-4xl mb-2">🕵️‍♂️</span>
                <span>
                  No transaction data available for category spending breakdown.
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Monthly Breakdown</h2>
          <MonthlyChart
            data={monthlyData?.monthlyData}
            loading={monthlyLoading}
            year={currentYear}
          />
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Transaction Analytics</h2>
          <TransactionAnalytics
            transactions={transactionsData?.transactions || []}
          />
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Transaction Stats</h2>
          <TransactionStats
            transactions={transactionsData?.transactions || []}
          />
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Budgets Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {budgetsData?.budgets && budgetsData.budgets.length > 0 ? (
              budgetsData.budgets.map((budget: any) => (
                <div
                  key={budget.id}
                  className="flex flex-col gap-2 p-4 border rounded-lg"
                  style={{ borderColor: budget.category.color }}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="text-2xl"
                      style={{ color: budget.category.color }}
                    >
                      {budget.category.icon}
                    </span>
                    <span className="font-medium">{budget.category.name}</span>
                    <span className="ml-2 px-2 py-1 text-xs rounded bg-gray-100 text-gray-600">
                      {budget.period}
                    </span>
                  </div>
                  <div className="flex gap-2 text-sm">
                    <span>Amount: {formatCurrencySymbol(budget.amount)}</span>
                    <span>Spent: {formatCurrencySymbol(budget.spent)}</span>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <span>Start: {budget.startDate.slice(0, 10)}</span>
                    <span>End: {budget.endDate.slice(0, 10)}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500 col-span-2">
                <span className="text-4xl mb-2">📊</span>
                <span>No budget data available.</span>
              </div>
            )}
          </div>
        </div>

        {/* Top Spending Sources */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Top Spending Sources</h2>
          <ul className="space-y-2">
            {transactionsData?.transactions &&
            transactionsData.transactions.filter(
              (t: any) => t.type === "EXPENSE"
            ).length > 0 ? (
              transactionsData.transactions
                .filter((t: any) => t.type === "EXPENSE")
                .sort((a: any, b: any) => b.amount - a.amount)
                .slice(0, 5)
                .map((txn: any) => (
                  <li key={txn.id} className="flex items-center gap-3">
                    <span
                      className="text-2xl"
                      style={{ color: txn.category.color }}
                    >
                      {txn.category.icon}
                    </span>
                    <span className="font-medium">{txn.category.name}</span>
                    <span className="ml-2 px-2 py-1 text-xs rounded bg-red-100 text-red-600">
                      -{formatCurrencySymbol(txn.amount)}
                    </span>
                    <span className="ml-2 text-xs text-gray-500">
                      {txn.description}
                    </span>
                  </li>
                ))
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                <span className="text-2xl mb-2">💸</span>
                <span>No expense transactions available.</span>
              </div>
            )}
          </ul>
        </div>

        {/* Top Income Sources */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Top Income Sources</h2>
          <ul className="space-y-2">
            {transactionsData?.transactions &&
            transactionsData.transactions.filter(
              (t: any) => t.type === "INCOME"
            ).length > 0 ? (
              transactionsData.transactions
                .filter((t: any) => t.type === "INCOME")
                .sort((a: any, b: any) => b.amount - a.amount)
                .slice(0, 5)
                .map((txn: any) => (
                  <li key={txn.id} className="flex items-center gap-3">
                    <span
                      className="text-2xl"
                      style={{ color: txn.category.color }}
                    >
                      {txn.category.icon}
                    </span>
                    <span className="font-medium">{txn.category.name}</span>
                    <span className="ml-2 px-2 py-1 text-xs rounded bg-green-100 text-green-600">
                      +{formatCurrencySymbol(txn.amount)}
                    </span>
                    <span className="ml-2 text-xs text-gray-500">
                      {txn.description}
                    </span>
                  </li>
                ))
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                <span className="text-2xl mb-2">💰</span>
                <span>No income transactions available.</span>
              </div>
            )}
          </ul>
        </div>

        {/* Budget Adherence */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Budget Adherence</h2>
          {budgetsData?.budgets && budgetsData.budgets.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left">Category</th>
                  <th>Period</th>
                  <th>Amount</th>
                  <th>Spent</th>
                  <th>Adherence</th>
                </tr>
              </thead>
              <tbody>
                {budgetsData.budgets.map((budget: any) => {
                  const percent =
                    budget.amount > 0
                      ? ((budget.spent / budget.amount) * 100).toFixed(1)
                      : "0";
                  return (
                    <tr key={budget.id}>
                      <td className="flex items-center gap-2 py-2">
                        <span
                          className="text-xl"
                          style={{ color: budget.category.color }}
                        >
                          {budget.category.icon}
                        </span>
                        {budget.category.name}
                      </td>
                      <td>{budget.period}</td>
                      <td>{formatCurrencySymbol(budget.amount)}</td>
                      <td>{formatCurrencySymbol(budget.spent)}</td>
                      <td>
                        <span
                          className={`px-2 py-1 rounded ${
                            parseFloat(percent) > 100
                              ? "bg-red-100 text-red-600"
                              : "bg-green-100 text-green-600"
                          }`}
                        >
                          {percent}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
              <span className="text-2xl mb-2">📉</span>
              <span>No budget adherence data available.</span>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Forecasts (Next Month)</h2>
          <ul className="space-y-2">
            {(() => {
              const months = monthlyData?.monthlyData || [];
              if (months.length === 0) {
                return (
                  <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                    <span className="text-2xl mb-2">🔮</span>
                    <span>No forecast data available.</span>
                  </div>
                );
              }
              const avgIncome = (
                months.reduce((sum: number, m: any) => sum + m.income, 0) /
                months.length
              ).toFixed(2);
              const avgExpense = (
                months.reduce((sum: number, m: any) => sum + m.expenses, 0) /
                months.length
              ).toFixed(2);
              return [
                <li key="income" className="flex items-center gap-3">
                  <span className="font-medium">Projected Income:</span>
                  <span className="ml-2 px-2 py-1 text-xs rounded bg-green-100 text-green-600">
                    {formatCurrencySymbol(Number(avgIncome))}
                  </span>
                </li>,
                <li key="expense" className="flex items-center gap-3">
                  <span className="font-medium">Projected Expenses:</span>
                  <span className="ml-2 px-2 py-1 text-xs rounded bg-red-100 text-red-600">
                    {formatCurrencySymbol(Number(avgExpense))}
                  </span>
                </li>,
              ];
            })()}
          </ul>
        </div>
      </div>
    </Layout>
  );
}
