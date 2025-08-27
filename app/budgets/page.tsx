"use client";

import React, { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_BUDGETS_QUERY,
  CREATE_BUDGET_MUTATION,
  UPDATE_BUDGET_MUTATION,
  DELETE_BUDGET_MUTATION,
  GET_CATEGORIES_QUERY,
} from "../../lib/graphql/queries";
import { Layout } from "../../components/layout/Layout";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { ConfirmationModal } from "../../components/ui/ConfirmationModal";

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: "INCOME" | "EXPENSE";
}

interface Budget {
  id: string;
  amount: number;
  spent: number;
  period: "WEEKLY" | "MONTHLY" | "YEARLY";
  startDate: string;
  endDate: string;
  createdAt: string;
  category: Category;
}

export default function BudgetsPage() {
  const { data: session, status } = useSession();
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [formState, setFormState] = useState<Partial<Budget>>({});
  const [isEditing, setIsEditing] = useState(false);

  // Always call hooks unconditionally
  const {
    data: budgetsData,
    loading: budgetsLoading,
    error: budgetsError,
    refetch: refetchBudgets,
  } = useQuery(GET_BUDGETS_QUERY, {
    skip: !session,
    fetchPolicy: "cache-first",
    nextFetchPolicy: "cache-only",
    notifyOnNetworkStatusChange: false,
    errorPolicy: "ignore",
    pollInterval: 0,
  });

  const [createBudget, { loading: creating }] = useMutation(
    CREATE_BUDGET_MUTATION,
    {
      onCompleted: () => {
        refetchBudgets();
        setFormState({});
      },
    }
  );

  const [updateBudget, { loading: updating }] = useMutation(
    UPDATE_BUDGET_MUTATION,
    {
      onCompleted: () => {
        refetchBudgets();
        setFormState({});
        setIsEditing(false);
        setSelectedBudget(null);
      },
    }
  );

  const [deleteBudget, { loading: deleting }] = useMutation(
    DELETE_BUDGET_MUTATION,
    {
      onCompleted: () => {
        refetchBudgets();
        setShowDeleteModal(false);
        setSelectedBudget(null);
      },
    }
  );

  const { data: categoriesData, loading: categoriesLoading } = useQuery(
    GET_CATEGORIES_QUERY,
    {
      skip: !session,
      fetchPolicy: "cache-first",
      nextFetchPolicy: "cache-only",
      notifyOnNetworkStatusChange: false,
      errorPolicy: "ignore",
      pollInterval: 0,
    }
  );

  const budgets = useMemo(() => budgetsData?.budgets || [], [budgetsData]);
  const categoriesList: Category[] = useMemo(
    () => categoriesData?.categories || [],
    [categoriesData]
  );

  if (budgetsLoading) {
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

  const handleEdit = (budget: Budget) => {
    setSelectedBudget(budget);
    setFormState({
      ...budget,
      category: budget.category,
      categoryId: budget.category.id,
      startDate: budget.startDate.slice(0, 10),
      endDate: budget.endDate.slice(0, 10),
    } as any);
    setIsEditing(true);
  };

  const handleDelete = (budget: Budget) => {
    setSelectedBudget(budget);
    setShowDeleteModal(true);
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const input = {
      ...formState,
      amount: Number(formState.amount),
      categoryId: (formState as any).categoryId,
      startDate: formState.startDate,
      endDate: formState.endDate,
      period: formState.period,
    };
    if (isEditing && selectedBudget) {
      updateBudget({
        variables: { input: { id: selectedBudget.id, ...input } },
      });
    } else {
      createBudget({ variables: { input } });
    }
  };

  const handleConfirmDelete = () => {
    if (selectedBudget) {
      deleteBudget({ variables: { id: selectedBudget.id } });
    }
  };

  // ...existing code...

  return (
    <Layout>
      <div className="max-w-3xl mx-auto py-8 space-y-8">
        <h1 className="text-3xl font-bold mb-6">Budgets</h1>

        <form
          onSubmit={handleFormSubmit}
          className="bg-white p-6 rounded-lg shadow space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              name="amount"
              type="number"
              value={formState.amount || ""}
              onChange={handleFormChange}
              placeholder="Budget Amount"
              className="input input-bordered w-full"
              required
            />
            <select
              name="categoryId"
              value={(formState as any).categoryId || ""}
              onChange={handleFormChange}
              className="input input-bordered w-full"
              required
            >
              <option value="" disabled>
                Select Category
              </option>
              {categoriesList.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
            <select
              name="period"
              value={formState.period || "MONTHLY"}
              onChange={handleFormChange}
              className="input input-bordered w-full"
              required
            >
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
              <option value="YEARLY">Yearly</option>
            </select>
            <input
              name="startDate"
              type="date"
              value={formState.startDate || ""}
              onChange={handleFormChange}
              className="input input-bordered w-full"
              required
            />
            <input
              name="endDate"
              type="date"
              value={formState.endDate || ""}
              onChange={handleFormChange}
              className="input input-bordered w-full"
              required
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={creating || updating}
            >
              {isEditing
                ? updating
                  ? "Updating..."
                  : "Update Budget"
                : creating
                ? "Creating..."
                : "Add Budget"}
            </button>
            {isEditing && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setIsEditing(false);
                  setFormState({});
                  setSelectedBudget(null);
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Your Budgets</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {budgets.map((budget: Budget) => (
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
                  <span>Amount: ${budget.amount}</span>
                  <span>Spent: ${budget.spent}</span>
                </div>
                <div className="flex gap-2 text-xs">
                  <span>Start: {budget.startDate.slice(0, 10)}</span>
                  <span>End: {budget.endDate.slice(0, 10)}</span>
                </div>
                <div className="flex gap-2 mt-2">
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={() => handleEdit(budget)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-sm btn-error"
                    onClick={() => handleDelete(budget)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <ConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleConfirmDelete}
          title="Delete Budget"
          message={`Are you sure you want to delete this budget? This action cannot be undone.`}
          confirmButtonStyle="danger"
          isLoading={deleting}
        />
      </div>
    </Layout>
  );
}
