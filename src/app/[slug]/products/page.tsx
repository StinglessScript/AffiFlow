"use client";

import { WorkspaceLayout } from "@/components/layout/workspace-layout";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { ProductDetailModal } from "@/components/workspace/product-detail-modal";
import { ProductForm } from "@/components/workspace/product-form";
import { ProductList } from "@/components/workspace/product-list";
import { useCurrentWorkspace } from "@/hooks/use-current-workspace";
import { useProducts } from "@/hooks/use-products";
import { CreateProductData, UpdateProductData } from "@/types";
import { Product } from "@prisma/client";
import { useParams } from "next/navigation";
import { useState } from "react";

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

export default function WorkspaceProductsPage() {
  const params = useParams();
  const workspaceSlug = params.slug as string;
  
  // Get workspace by slug
  const { workspace, isLoading: workspaceLoading } = useCurrentWorkspace();

  // State for modals and forms
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductWithRelations | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State for search and filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Use products hook
  const {
    products,
    isLoading,
    error,
    createProduct,
    updateProduct,
    deleteProduct,
    refetch,
  } = useProducts({
    workspaceId: workspace?.id || "",
    page: currentPage,
    limit: 20,
    search: searchQuery,
    platform: selectedPlatform,
  });

  // Handlers
  const handleCreate = () => {
    setSelectedProduct(null);
    setIsCreateModalOpen(true);
  };

  const handleEdit = (product: ProductWithRelations) => {
    setSelectedProduct(product);
    setIsEditModalOpen(true);
  };

  const handleView = (product: ProductWithRelations) => {
    setSelectedProduct(product);
    setIsDetailModalOpen(true);
  };

  const handleCreateSubmit = async (data: Omit<CreateProductData, 'workspaceId'>) => {
    setIsSubmitting(true);
    try {
      await createProduct(data);
      setIsCreateModalOpen(false);
    } catch (error) {
      // Error is handled in the hook and form
      console.error("Create product error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (data: UpdateProductData) => {
    if (!selectedProduct) return;
    
    setIsSubmitting(true);
    try {
      await updateProduct(selectedProduct.id, data);
      setIsEditModalOpen(false);
      setSelectedProduct(null);
    } catch (error) {
      // Error is handled in the hook and form
      console.error("Update product error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (productId: string) => {
    await deleteProduct(productId);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handlePlatformChange = (platform: string) => {
    setSelectedPlatform(platform === "all" ? "" : platform);
    setCurrentPage(1); // Reset to first page when filtering
  };

  if (workspaceLoading) {
    return (
      <WorkspaceLayout>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading workspace...</p>
        </div>
      </WorkspaceLayout>
    );
  }

  if (!workspace) {
    return (
      <WorkspaceLayout>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Workspace Not Found</h2>
          <p className="text-gray-600">The workspace "{workspaceSlug}" could not be found.</p>
        </div>
      </WorkspaceLayout>
    );
  }

  if (error) {
    return (
      <WorkspaceLayout>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Error Loading Products</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={refetch}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </WorkspaceLayout>
    );
  }

  return (
    <WorkspaceLayout>
      <ProductList
        products={products}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        onCreate={handleCreate}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        selectedPlatform={selectedPlatform}
        onPlatformChange={handlePlatformChange}
      />

      {/* Create Product Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
            <DialogDescription>
              Add a new affiliate product to your workspace with details and affiliate link.
            </DialogDescription>
          </DialogHeader>
          <ProductForm
            workspaceId={workspace?.id || ""}
            onSubmit={handleCreateSubmit}
            onCancel={() => setIsCreateModalOpen(false)}
            isLoading={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Product Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Update your product information and affiliate link details.
            </DialogDescription>
          </DialogHeader>
          {selectedProduct && (
            <ProductForm
              product={selectedProduct}
              workspaceId={workspace?.id || ""}
              onSubmit={handleEditSubmit}
              onCancel={() => {
                setIsEditModalOpen(false);
                setSelectedProduct(null);
              }}
              isLoading={isSubmitting}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedProduct(null);
        }}
        onEdit={(product) => {
          setIsDetailModalOpen(false);
          handleEdit(product);
        }}
      />
    </WorkspaceLayout>
  );
}
