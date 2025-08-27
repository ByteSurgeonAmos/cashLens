"use client";

import React, { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_CATEGORIES_QUERY,
  CREATE_CATEGORY_MUTATION,
  UPDATE_CATEGORY_MUTATION,
  DELETE_CATEGORY_MUTATION,
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
  createdAt: string;
}

export default function CategoriesPage() {
  const { data: session, status } = useSession();
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [formState, setFormState] = useState<Partial<Category>>({});
  const [isEditing, setIsEditing] = useState(false);

  const {
    data: categoriesData,
    loading: categoriesLoading,
    error: categoriesError,
    refetch: refetchCategories,
  } = useQuery(GET_CATEGORIES_QUERY, {
    skip: !session,
    fetchPolicy: "cache-first",
    nextFetchPolicy: "cache-only",
    notifyOnNetworkStatusChange: false,
    errorPolicy: "ignore",
    pollInterval: 0,
  });

  const [createCategory, { loading: creating }] = useMutation(
    CREATE_CATEGORY_MUTATION,
    {
      onCompleted: () => {
        refetchCategories();
        setFormState({});
      },
    }
  );

  const [updateCategory, { loading: updating }] = useMutation(
    UPDATE_CATEGORY_MUTATION,
    {
      onCompleted: () => {
        refetchCategories();
        setFormState({});
        setIsEditing(false);
        setSelectedCategory(null);
      },
    }
  );

  const [deleteCategory, { loading: deleting }] = useMutation(
    DELETE_CATEGORY_MUTATION,
    {
      onCompleted: () => {
        refetchCategories();
        setShowDeleteModal(false);
        setSelectedCategory(null);
      },
    }
  );

  const categories = useMemo(
    () => categoriesData?.categories || [],
    [categoriesData]
  );

  if (categoriesLoading) {
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

  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    setFormState(category);
    setIsEditing(true);
  };

  const handleDelete = (category: Category) => {
    setSelectedCategory(category);
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
    if (isEditing && selectedCategory) {
      updateCategory({
        variables: { input: { id: selectedCategory.id, ...formState } },
      });
    } else {
      createCategory({ variables: { input: formState } });
    }
  };

  const handleConfirmDelete = () => {
    if (selectedCategory) {
      deleteCategory({ variables: { id: selectedCategory.id } });
    }
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto py-8 space-y-8">
        <h1 className="text-3xl font-bold mb-6">Categories</h1>

        <form
          onSubmit={handleFormSubmit}
          className="bg-white p-6 rounded-lg shadow space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              name="name"
              value={formState.name || ""}
              onChange={handleFormChange}
              placeholder="Category Name"
              className="input input-bordered w-full"
              required
            />
            <input
              name="icon"
              value={formState.icon || ""}
              onChange={handleFormChange}
              placeholder="Icon (e.g. 💸)"
              className="input input-bordered w-full"
              required
            />
            <input
              name="color"
              value={formState.color || ""}
              onChange={handleFormChange}
              placeholder="Color (e.g. #dc2626)"
              className="input input-bordered w-full"
              required
            />
            <select
              name="type"
              value={formState.type || "EXPENSE"}
              onChange={handleFormChange}
              className="input input-bordered w-full"
              required
            >
              <option value="EXPENSE">Expense</option>
              <option value="INCOME">Income</option>
            </select>
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
                  : "Update Category"
                : creating
                ? "Creating..."
                : "Add Category"}
            </button>
            {isEditing && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setIsEditing(false);
                  setFormState({});
                  setSelectedCategory(null);
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Your Categories</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.map((category: Category) => (
              <div
                key={category.id}
                className="flex items-center justify-between p-4 border rounded-lg"
                style={{ borderColor: category.color }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl" style={{ color: category.color }}>
                    {category.icon}
                  </span>
                  <span className="font-medium">{category.name}</span>
                  <span className="ml-2 px-2 py-1 text-xs rounded bg-gray-100 text-gray-600">
                    {category.type}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={() => handleEdit(category)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-sm btn-error"
                    onClick={() => handleDelete(category)}
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
          title="Delete Category"
          message={`Are you sure you want to delete the category "${selectedCategory?.name}"? This action cannot be undone.`}
          confirmButtonStyle="danger"
          isLoading={deleting}
        />
      </div>
    </Layout>
  );
}
