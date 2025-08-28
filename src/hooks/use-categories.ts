"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  description?: string;
  color?: string;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    products: number;
  };
}

interface CreateCategoryData {
  name: string;
  description?: string;
  color?: string;
}

interface UpdateCategoryData {
  name?: string;
  description?: string;
  color?: string;
}

interface UseCategoriesProps {
  workspaceId: string;
}

export function useCategories({ workspaceId }: UseCategoriesProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async () => {
    if (!workspaceId) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/workspaces/${workspaceId}/categories`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch categories");
      }

      if (result.success) {
        setCategories(result.data || []);
      } else {
        throw new Error(result.error || "Failed to fetch categories");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch categories";
      setError(errorMessage);
      console.error("Fetch categories error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const createCategory = async (data: CreateCategoryData) => {
    if (!workspaceId) throw new Error("No workspace ID provided");

    const response = await fetch(`/api/workspaces/${workspaceId}/categories`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Failed to create category");
    }

    if (result.success) {
      const newCategory = result.data;
      setCategories((prev) => [newCategory, ...prev]);
      toast.success("Category created successfully!");
      return newCategory;
    } else {
      throw new Error(result.error || "Failed to create category");
    }
  };

  const updateCategory = async (
    categoryId: string,
    data: UpdateCategoryData
  ) => {
    if (!workspaceId) throw new Error("No workspace ID provided");

    const response = await fetch(
      `/api/workspaces/${workspaceId}/categories/${categoryId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Failed to update category");
    }

    if (result.success) {
      toast.success("Category updated successfully!");
      return result.data;
    } else {
      throw new Error(result.error || "Failed to update category");
    }
  };

  const deleteCategory = async (categoryId: string) => {
    if (!workspaceId) throw new Error("No workspace ID provided");

    const response = await fetch(
      `/api/workspaces/${workspaceId}/categories/${categoryId}`,
      {
        method: "DELETE",
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Failed to delete category");
    }

    if (result.success) {
      toast.success("Category deleted successfully!");
      return true;
    } else {
      throw new Error(result.error || "Failed to delete category");
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [workspaceId]);

  return {
    categories,
    isLoading,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
    refetch: fetchCategories,
  };
}
