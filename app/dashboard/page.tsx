"use client";

import { useSession } from "next-auth/react";
import { useQuery } from "@apollo/client";
import {
  DASHBOARD_STATS_QUERY,
  MONTHLY_DATA_QUERY,
} from "../../lib/graphql/queries";
import { DashboardHeader } from "../../components/dashboard/DashboardHeader";
import { StatsCards } from "../../components/dashboard/StatsCards";
import { MonthlyChart } from "../../components/dashboard/MonthlyChart";
import { RecentTransactions } from "../../components/dashboard/RecentTransactions";
import { QuickActions } from "../../components/dashboard/QuickActions";
import { Layout } from "../../components/layout/Layout";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const currentYear = new Date().getFullYear();

  const { data: statsData, loading: statsLoading } = useQuery(
    DASHBOARD_STATS_QUERY,
    {
      skip: status !== "authenticated",
    }
  );

  const { data: monthlyData, loading: monthlyLoading } = useQuery(
    MONTHLY_DATA_QUERY,
    {
      variables: { year: currentYear },
      skip: status !== "authenticated",
    }
  );

  if (status === "loading" || statsLoading) {
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

  const stats = statsData?.dashboardStats;
  const monthly = monthlyData?.monthlyData;

  return (
    <Layout>
      <div className="space-y-6">
        <DashboardHeader user={session?.user} />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <StatsCards stats={stats} loading={statsLoading} />

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <MonthlyChart
                data={monthly}
                loading={monthlyLoading}
                year={currentYear}
              />
              <QuickActions />
            </div>
          </div>

          <div className="lg:col-span-1">
            <RecentTransactions />
          </div>
        </div>
      </div>
    </Layout>
  );
}
