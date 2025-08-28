"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { WorkspaceLayout } from "@/components/layout/workspace-layout";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CategoryForm } from "@/components/workspace/category-form";
import { CategoryList } from "@/components/workspace/category-list";
import { useCategories } from "@/hooks/use-categories";
import { Category } from "@prisma/client";

export default function CategoriesPage() {
  const params = useParams();
  const workspaceSlug = params.slug as string;
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const {
    categories,
    isLoading,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
    refetch,
  } = useCategories(workspaceSlug);

  const handleCreateCategory = async (data: any) => {
    try {
      await createCategory(data);
      setIsCreateModalOpen(false);
      refetch();
    } catch (error) {
      console.error("Create category error:", error);
    }
  };

  const handleEditCategory = (category: Category) => {
    setSelectedCategory(category);
    setIsEditModalOpen(true);
  };

  const handleUpdateCategory = async (data: any) => {
    if (!selectedCategory) return;
    
    try {
      await updateCategory(selectedCategory.id, data);
      setIsEditModalOpen(false);
      setSelectedCategory(null);
      refetch();
    } catch (error) {
      console.error("Update category error:", error);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      await deleteCategory(categoryId);
      refetch();
    } catch (error) {
      console.error("Delete category error:", error);
    }
  };

  return (
    <WorkspaceLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Categories</h2>
            <p className="text-muted-foreground">
              Organize your products with categories
            </p>
          </div>
        </div>

        {/* Categories List */}
        <CategoryList
          categories={categories}
          isLoading={isLoading}
          error={error}
          onEdit={handleEditCategory}
          onDelete={handleDeleteCategory}
          onCreateNew={() => setIsCreateModalOpen(true)}
        />

        {/* Create Category Modal */}
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Category</DialogTitle>
              <DialogDescription>
                Add a new category to organize your products.
              </DialogDescription>
            </DialogHeader>
            <CategoryForm
              onSubmit={handleCreateCategory}
              onCancel={() => setIsCreateModalOpen(false)}
            />
          </DialogContent>
        </Dialog>

        {/* Edit Category Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Category</DialogTitle>
              <DialogDescription>
                Update your category information.
              </DialogDescription>
            </DialogHeader>
            <CategoryForm
              category={selectedCategory}
              onSubmit={handleUpdateCategory}
              onCancel={() => {
                setIsEditModalOpen(false);
                setSelectedCategory(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
    </WorkspaceLayout>
  );
}
