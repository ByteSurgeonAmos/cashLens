"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ReactNode, useState } from "react";
import Image from "next/image";
import { ConfirmationModal } from "../ui/ConfirmationModal";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: "📊" },
    { name: "Transactions", href: "/transactions", icon: "💸" },
    { name: "Categories", href: "/categories", icon: "🏷️" },
    { name: "Budgets", href: "/budgets", icon: "🎯" },
    { name: "Reports", href: "/reports", icon: "📈" },
    { name: "Settings", href: "/settings", icon: "⚙️" },
  ];

  const handleSignOut = () => {
    setShowSignOutModal(true);
  };

  const confirmSignOut = () => {
    setShowSignOutModal(false);
    signOut({ callbackUrl: "/auth/signin" });
  };

  const handleNavigation = (href: string) => {
    router.push(href);
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="bg-white p-2 rounded-lg shadow-lg border border-gray-200"
        >
          <span className="text-xl">☰</span>
        </button>
      </div>

      <div
        className={`fixed inset-y-0 left-0 z-50 w-60 lg:w-64 xl:w-68 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out flex flex-col ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="flex items-center justify-center h-14 lg:h-16 border-b border-gray-200 px-4 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 lg:w-8 lg:h-8 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
              <Image
                src="/logo.png"
                alt="CashLens Logo"
                width={28}
                height={28}
                className="lg:w-6 lg:h-6"
              />
            </div>
            <span className="text-lg lg:text-xl font-bold text-gray-900">
              CashLens
            </span>
          </div>
        </div>

        <nav className="flex-1 mt-4 px-3 lg:px-4 overflow-y-auto">
          <ul className="space-y-1">
            {navigation.map((item) => (
              <li key={item.name}>
                <button
                  onClick={() => handleNavigation(item.href)}
                  className="w-full flex items-center px-3 py-2.5 lg:py-3 text-left text-gray-700 rounded-lg hover:bg-primary-50 hover:text-primary-700 transition-colors duration-200 group"
                >
                  <span className="text-base lg:text-lg mr-2.5 group-hover:scale-110 transition-transform">
                    {item.icon}
                  </span>
                  <span className="font-medium text-sm lg:text-base">
                    {item.name}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex-shrink-0 p-3 lg:p-4 border-t border-gray-200 bg-white">
          <div className="flex items-center space-x-2.5 mb-3">
            {session?.user?.image ? (
              <img
                src={session.user.image}
                alt={session?.user?.name || "User"}
                className="w-9 h-9 lg:w-10 lg:h-10 rounded-full bg-gray-300"
              />
            ) : (
              <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-full bg-blue-600 flex items-center justify-center">
                <span className="text-white font-medium text-xs lg:text-sm">
                  {session?.user?.name
                    ? session.user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)
                    : "U"}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs lg:text-sm font-medium text-gray-900 truncate">
                {session?.user?.name || "User"}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {session?.user?.email}
              </p>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 lg:py-2.5 px-3 rounded-lg transition-colors duration-200 text-xs lg:text-sm"
          >
            Sign Out
          </button>
        </div>
      </div>

      <div className="lg:pl-64 xl:pl-68">
        <main className="p-4 lg:p-6 xl:p-8 pt-16 lg:pt-6">{children}</main>
      </div>

      <ConfirmationModal
        isOpen={showSignOutModal}
        onClose={() => setShowSignOutModal(false)}
        onConfirm={confirmSignOut}
        title="Sign Out"
        message={
          <div>
            <p className="text-gray-600 mb-2">
              Are you sure you want to sign out of CashLens?
            </p>
            <p className="text-sm text-gray-500">
              You'll need to sign in again to access your account.
            </p>
          </div>
        }
        confirmText="Sign Out"
        cancelText="Cancel"
        confirmButtonStyle="danger"
      />
    </div>
  );
}
