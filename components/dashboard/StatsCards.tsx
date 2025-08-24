"use client";

import { LoadingSpinner } from "../ui/LoadingSpinner";

interface StatsCardsProps {
  stats?: {
    totalIncome: number;
    totalExpenses: number;
    balance: number;
    transactionCount: number;
    categoriesCount: number;
  };
  loading?: boolean;
}

export function StatsCards({ stats, loading }: StatsCardsProps) {
  if (loading) {
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const cards = [
    {
      title: "Total Income",
      value: formatCurrency(stats?.totalIncome || 0),
      icon: "📈",
      color: "income-card",
      change: "+5.2%",
    },
    {
      title: "Total Expenses",
      value: formatCurrency(stats?.totalExpenses || 0),
      icon: "📉",
      color: "expense-card",
      change: "+2.1%",
    },
    {
      title: "Balance",
      value: formatCurrency(stats?.balance || 0),
      icon: "💰",
      color: "stat-card",
      change: "+3.1%",
    },
    {
      title: "Transactions",
      value: stats?.transactionCount?.toString() || "0",
      icon: "🔄",
      color: "stat-card",
      change: `${stats?.categoriesCount || 0} categories`,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <div key={index} className={`${card.color} animate-fade-in`}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium mb-1">
                {card.title}
              </p>
              <p className="text-2xl font-bold text-white mb-2">{card.value}</p>
              <p className="text-white/60 text-xs">{card.change}</p>
            </div>
            <div className="text-2xl opacity-80">{card.icon}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
