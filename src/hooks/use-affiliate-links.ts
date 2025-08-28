"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

interface AffiliateLink {
  id: string;
  name: string;
  description?: string;
  originalUrl: string;
  affiliateUrl: string;
  platform: string;
  commission?: number;
  commissionType: string;
  tags?: string;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    clicks: number;
    conversions: number;
  };
}

interface CreateAffiliateLinkData {
  name: string;
  description?: string;
  originalUrl: string;
  affiliateUrl: string;
  platform: string;
  commission?: number;
  commissionType?: string;
  tags?: string;
  productId: string;
}

interface UpdateAffiliateLinkData {
  name?: string;
  description?: string;
  originalUrl?: string;
  affiliateUrl?: string;
  platform?: string;
  commission?: number;
  commissionType?: string;
  tags?: string;
}

interface UseAffiliateLinksProps {
  workspaceId: string;
  productId?: string;
}

export function useAffiliateLinks({
  workspaceId,
  productId,
}: UseAffiliateLinksProps) {
  const [affiliateLinks, setAffiliateLinks] = useState<AffiliateLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAffiliateLinks = async () => {
    if (!workspaceId) return;

    try {
      setIsLoading(true);
      setError(null);

      const url = productId
        ? `/api/workspaces/${workspaceId}/products/${productId}/affiliate-links`
        : `/api/workspaces/${workspaceId}/affiliate-links`;

      const response = await fetch(url);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch affiliate links");
      }

      if (result.success) {
        setAffiliateLinks(result.data || []);
      } else {
        throw new Error(result.error || "Failed to fetch affiliate links");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch affiliate links";
      setError(errorMessage);
      console.error("Fetch affiliate links error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const createAffiliateLink = async (data: CreateAffiliateLinkData) => {
    if (!workspaceId) throw new Error("No workspace ID provided");

    const response = await fetch(
      `/api/workspaces/${workspaceId}/affiliate-links`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Failed to create affiliate link");
    }

    if (result.success) {
      const newLink = result.data;
      setAffiliateLinks((prev) => [newLink, ...prev]);
      toast.success("Affiliate link created successfully!");
      return newLink;
    } else {
      throw new Error(result.error || "Failed to create affiliate link");
    }
  };

  const updateAffiliateLink = async (
    linkId: string,
    data: UpdateAffiliateLinkData
  ) => {
    if (!workspaceId) throw new Error("No workspace ID provided");

    const response = await fetch(
      `/api/workspaces/${workspaceId}/affiliate-links/${linkId}`,
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
      throw new Error(result.error || "Failed to update affiliate link");
    }

    if (result.success) {
      toast.success("Affiliate link updated successfully!");
      return result.data;
    } else {
      throw new Error(result.error || "Failed to update affiliate link");
    }
  };

  const deleteAffiliateLink = async (linkId: string) => {
    if (!workspaceId) throw new Error("No workspace ID provided");

    const response = await fetch(
      `/api/workspaces/${workspaceId}/affiliate-links/${linkId}`,
      {
        method: "DELETE",
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Failed to delete affiliate link");
    }

    if (result.success) {
      toast.success("Affiliate link deleted successfully!");
      return true;
    } else {
      throw new Error(result.error || "Failed to delete affiliate link");
    }
  };

  const setActiveAffiliateLink = async (linkId: string) => {
    if (!workspaceId) throw new Error("No workspace ID provided");

    const response = await fetch(
      `/api/workspaces/${workspaceId}/affiliate-links/${linkId}/set-active`,
      {
        method: "POST",
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Failed to set active affiliate link");
    }

    if (result.success) {
      toast.success("Affiliate link set as active successfully!");
      return result.data;
    } else {
      throw new Error(result.error || "Failed to set active affiliate link");
    }
  };

  useEffect(() => {
    fetchAffiliateLinks();
  }, [workspaceId, productId]);

  return {
    affiliateLinks,
    isLoading,
    error,
    createAffiliateLink,
    updateAffiliateLink,
    deleteAffiliateLink,
    setActiveAffiliateLink,
    refetch: fetchAffiliateLinks,
  };
}
