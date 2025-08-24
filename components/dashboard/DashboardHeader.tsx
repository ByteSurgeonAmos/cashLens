"use client";

interface DashboardHeaderProps {
  user?: {
    name?: string | null;
    email?: string | null;
  };
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const currentTime = new Date();
  const currentHour = currentTime.getHours();

  const getGreeting = () => {
    if (currentHour < 12) return "Good morning";
    if (currentHour < 18) return "Good afternoon";
    return "Good evening";
  };

  const formatDate = () => {
    return currentTime.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        {getGreeting()}, {user?.name?.split(" ")[0] || "there"}! 👋
      </h1>
      <p className="text-gray-600 text-lg">
        {formatDate()} • Here's your financial overview
      </p>
    </div>
  );
}
