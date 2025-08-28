"use client";

import { WorkspaceLayout } from "@/components/layout/workspace-layout";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { AffiliateForm } from "@/components/workspace/affiliate-form";
import { AffiliateList } from "@/components/workspace/affiliate-list";
import { useAffiliateLinks } from "@/hooks/use-affiliate-links";
import { useProducts } from "@/hooks/use-products";
import { AffiliateLink } from "@prisma/client";
import { useParams } from "next/navigation";
import { useState } from "react";

export default function AffiliateLinksPage() {
  const params = useParams();
  const workspaceSlug = params.slug as string;
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedLink, setSelectedLink] = useState<AffiliateLink | null>(null);

  const {
    affiliateLinks,
    isLoading,
    error,
    createAffiliateLink,
    updateAffiliateLink,
    deleteAffiliateLink,
    setActiveAffiliateLink,
    refetch,
  } = useAffiliateLinks(workspaceSlug);

  const { products } = useProducts(workspaceSlug);

  const handleCreateLink = async (data: any) => {
    try {
      await createAffiliateLink(data);
      setIsCreateModalOpen(false);
      refetch();
    } catch (error) {
      console.error("Create affiliate link error:", error);
    }
  };

  const handleEditLink = (link: AffiliateLink) => {
    setSelectedLink(link);
    setIsEditModalOpen(true);
  };

  const handleUpdateLink = async (data: any) => {
    if (!selectedLink) return;
    
    try {
      await updateAffiliateLink(selectedLink.id, data);
      setIsEditModalOpen(false);
      setSelectedLink(null);
      refetch();
    } catch (error) {
      console.error("Update affiliate link error:", error);
    }
  };

  const handleDeleteLink = async (linkId: string) => {
    try {
      await deleteAffiliateLink(linkId);
      refetch();
    } catch (error) {
      console.error("Delete affiliate link error:", error);
    }
  };

  const handleSetActiveLink = async (linkId: string) => {
    try {
      await setActiveAffiliateLink(linkId);
      refetch();
    } catch (error) {
      console.error("Set active affiliate link error:", error);
    }
  };

  return (
    <WorkspaceLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Affiliate Links</h2>
            <p className="text-muted-foreground">
              Manage your affiliate links and track performance
            </p>
          </div>
        </div>

        {/* Affiliate Links List */}
        <AffiliateList
          affiliateLinks={affiliateLinks}
          isLoading={isLoading}
          error={error}
          onEdit={handleEditLink}
          onDelete={handleDeleteLink}
          onSetActive={handleSetActiveLink}
          onCreateNew={() => setIsCreateModalOpen(true)}
        />

        {/* Create Affiliate Link Modal */}
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Affiliate Link</DialogTitle>
              <DialogDescription>
                Add a new affiliate link to track and manage your partnerships.
              </DialogDescription>
            </DialogHeader>
            <AffiliateForm
              products={products || []}
              onSubmit={handleCreateLink}
              onCancel={() => setIsCreateModalOpen(false)}
            />
          </DialogContent>
        </Dialog>

        {/* Edit Affiliate Link Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Affiliate Link</DialogTitle>
              <DialogDescription>
                Update your affiliate link information.
              </DialogDescription>
            </DialogHeader>
            <AffiliateForm
              affiliateLink={selectedLink}
              products={products || []}
              onSubmit={handleUpdateLink}
              onCancel={() => {
                setIsEditModalOpen(false);
                setSelectedLink(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
    </WorkspaceLayout>
  );
}
