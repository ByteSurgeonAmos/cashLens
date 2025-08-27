import React from "react";
import { Pie } from "react-chartjs-2";
import { Chart, ArcElement, Tooltip, Legend } from "chart.js";
Chart.register(ArcElement, Tooltip, Legend);

interface CategorySpendingPieChartProps {
  transactions: any[];
}

export const CategorySpendingPieChart: React.FC<
  CategorySpendingPieChartProps
> = ({ transactions }) => {
  const expenses = transactions.filter((t) => t.type === "EXPENSE");
  const categoryTotals: Record<
    string,
    { name: string; color: string; icon: string; total: number }
  > = {};
  expenses.forEach((txn) => {
    const catId = txn.category.id;
    if (!categoryTotals[catId]) {
      categoryTotals[catId] = {
        name: txn.category.name,
        color: txn.category.color,
        icon: txn.category.icon,
        total: 0,
      };
    }
    categoryTotals[catId].total += txn.amount;
  });
  const labels = Object.values(categoryTotals).map((cat) => cat.name);
  const data = Object.values(categoryTotals).map((cat) => cat.total);
  const backgroundColors = Object.values(categoryTotals).map(
    (cat) => cat.color
  );

  const chartData = {
    labels,
    datasets: [
      {
        data,
        backgroundColor: backgroundColors,
        borderWidth: 2,
      },
    ],
  };

  return (
    <div className="w-full flex flex-col items-center">
      <Pie
        data={chartData}
        options={{
          plugins: {
            legend: {
              display: true,
              position: "right",
              labels: {
                font: { size: 14 },
              },
            },
          },
        }}
      />
      <div className="mt-4 flex flex-wrap gap-4 justify-center">
        {Object.values(categoryTotals).map((cat) => (
          <div key={cat.name} className="flex items-center gap-2">
            <span className="text-xl" style={{ color: cat.color }}>
              {cat.icon}
            </span>
            <span className="font-medium">{cat.name}</span>
            <span className="ml-2 text-xs text-gray-500">
              ${cat.total.toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
