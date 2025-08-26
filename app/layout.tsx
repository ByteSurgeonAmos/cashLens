import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../components/providers/AuthProvider";
import { ApolloProvider } from "../components/providers/ApolloProvider";
import { CurrencyProvider } from "../contexts/CurrencyContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CashLens - Financial Tracker",
  description:
    "Track your finances with real-time updates and beautiful insights",
  keywords: ["finance", "budget", "money", "tracker", "expenses", "income"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <ApolloProvider>
            <CurrencyProvider>{children}</CurrencyProvider>
          </ApolloProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
