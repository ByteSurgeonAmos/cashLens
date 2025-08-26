"use client";

import { useSession } from "next-auth/react";
import { useQuery } from "@apollo/client";
import { useMemo } from "react";
import { MONTHLY_DATA_QUERY } from "../../lib/graphql/queries";
import { DashboardHeader } from "../../components/dashboard/DashboardHeader";
import { StatsCards } from "../../components/dashboard/StatsCards";
import { MonthlyChart } from "../../components/dashboard/MonthlyChart";
import { RecentTransactions } from "../../components/dashboard/RecentTransactions";
import { QuickActions } from "../../components/dashboard/QuickActions";
import { Layout } from "../../components/layout/Layout";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";

export default function DashboardPage() {
  const { data: session, status } = useSession();

  const currentYear = useMemo(() => new Date().getFullYear(), []);

  const {
    data: monthlyData,
    loading: monthlyLoading,
    error: monthlyError,
  } = useQuery(MONTHLY_DATA_QUERY, {
    variables: { year: currentYear },
    skip: status !== "authenticated",
    fetchPolicy: "cache-first",
    notifyOnNetworkStatusChange: false,
    errorPolicy: "ignore",
    pollInterval: 0, // Disable automatic polling
  });

  const monthly = useMemo(() => monthlyData?.monthlyData, [monthlyData]);
  const isLoading = useMemo(
    () => monthlyLoading && !monthlyData,
    [monthlyLoading, monthlyData]
  );

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
      <div className="max-w-[2000px] mx-auto space-y-6 xl:space-y-8 2xl:space-y-10">
        <DashboardHeader user={session?.user} />

        <div className="w-full">
          <StatsCards />
        </div>

        <div className="w-full">
          <MonthlyChart
            data={monthly}
            loading={monthlyLoading}
            year={currentYear}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 xl:gap-8">
          <div className="w-full">
            <RecentTransactions />
          </div>

          <div className="w-full">
            <QuickActions />
          </div>
        </div>
      </div>
    </Layout>
  );
}
