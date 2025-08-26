"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import { useCurrency } from "../../contexts/CurrencyContext";

interface MonthlyChartProps {
  data?: Array<{
    month: string;
    income: number;
    expenses: number;
  }>;
  loading?: boolean;
  year: number;
}

export function MonthlyChart({ data, loading, year }: MonthlyChartProps) {
  const { formatCurrency } = useCurrency();

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center h-80">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Monthly Overview
        </h3>
        <span className="text-sm text-gray-500">{year}</span>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
            <YAxis
              stroke="#6b7280"
              fontSize={12}
              tickFormatter={formatCurrency}
            />
            <Tooltip
              formatter={(value: number, name: string) => [
                formatCurrency(value),
                name === "income" ? "Income" : "Expenses",
              ]}
              labelStyle={{ color: "#374151" }}
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              }}
            />
            <Bar
              dataKey="income"
              fill="#22c55e"
              radius={[4, 4, 0, 0]}
              name="income"
            />
            <Bar
              dataKey="expenses"
              fill="#ef4444"
              radius={[4, 4, 0, 0]}
              name="expenses"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex items-center justify-center space-x-6 text-sm">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-success-500 rounded-full mr-2"></div>
          <span className="text-gray-600">Income</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-danger-500 rounded-full mr-2"></div>
          <span className="text-gray-600">Expenses</span>
        </div>
      </div>
    </div>
  );
}
