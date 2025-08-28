"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Product } from "@prisma/client";
import { CreateProductData, UpdateProductData, ApiResponse } from "@/types";

interface ProductWithRelations extends Product {
  posts: Array<{
    id: string;
    post: {
      id: string;
      title: string;
      slug: string;
      thumbnail?: string;
      isPublished: boolean;
      createdAt: Date;
    };
  }>;
  _count: {
    posts: number;
  };
}

interface ProductsResponse {
  products: ProductWithRelations[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface UseProductsOptions {
  workspaceId: string;
  page?: number;
  limit?: number;
  search?: string;
  platform?: string;
}

export function useProducts(options: UseProductsOptions) {
  const { data: session } = useSession();
  const [products, setProducts] = useState<ProductWithRelations[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { workspaceId, page = 1, limit = 20, search = '', platform = '' } = options;

  const fetchProducts = async () => {
    if (!session?.user || !workspaceId) {
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
        ...(platform && { platform }),
      });

      const response = await fetch(`/api/workspaces/${workspaceId}/products?${params}`);
      const data: ApiResponse<ProductsResponse> = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch products");
      }

      if (data.data) {
        setProducts(data.data.products);
        setPagination(data.data.pagination);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch products");
    } finally {
      setIsLoading(false);
    }
  };

  const createProduct = async (productData: Omit<CreateProductData, 'workspaceId'>) => {
    try {
      setError(null);
      const response = await fetch(`/api/workspaces/${workspaceId}/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...productData,
          workspaceId,
        }),
      });

      const data: ApiResponse<ProductWithRelations> = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create product");
      }

      // Add new product to the list
      if (data.data) {
        setProducts(prev => [data.data!, ...prev]);
        setPagination(prev => ({ ...prev, total: prev.total + 1 }));
      }

      return data.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create product";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateProduct = async (productId: string, updateData: UpdateProductData) => {
    try {
      setError(null);
      const response = await fetch(`/api/workspaces/${workspaceId}/products/${productId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      const data: ApiResponse<ProductWithRelations> = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update product");
      }

      // Update product in the list
      if (data.data) {
        setProducts(prev => 
          prev.map(product => product.id === productId ? data.data! : product)
        );
      }

      return data.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update product";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const deleteProduct = async (productId: string) => {
    try {
      setError(null);
      const response = await fetch(`/api/workspaces/${workspaceId}/products/${productId}`, {
        method: "DELETE",
      });

      const data: ApiResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete product");
      }

      // Remove product from the list
      setProducts(prev => prev.filter(product => product.id !== productId));
      setPagination(prev => ({ ...prev, total: prev.total - 1 }));

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete product";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const getProduct = async (productId: string) => {
    try {
      setError(null);
      const response = await fetch(`/api/workspaces/${workspaceId}/products/${productId}`);
      const data: ApiResponse<ProductWithRelations> = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch product");
      }

      return data.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch product";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [session, workspaceId, page, limit, search, platform]);

  return {
    products,
    pagination,
    isLoading,
    error,
    createProduct,
    updateProduct,
    deleteProduct,
    getProduct,
    refetch: fetchProducts,
  };
}
