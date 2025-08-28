"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { WorkspaceWithUsers, CreateWorkspaceData, ApiResponse } from "@/types";

export function useWorkspaces() {
  const { data: session } = useSession();
  const [workspaces, setWorkspaces] = useState<WorkspaceWithUsers[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkspaces = async () => {
    if (!session?.user) {
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      const response = await fetch("/api/workspaces");
      const data: ApiResponse<WorkspaceWithUsers[]> = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch workspaces");
      }

      setWorkspaces(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch workspaces");
    } finally {
      setIsLoading(false);
    }
  };

  const createWorkspace = async (workspaceData: CreateWorkspaceData) => {
    try {
      setError(null);
      const response = await fetch("/api/workspaces", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(workspaceData),
      });

      const data: ApiResponse<WorkspaceWithUsers> = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create workspace");
      }

      // Add new workspace to the list
      if (data.data) {
        setWorkspaces(prev => [data.data!, ...prev]);
      }

      return data.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create workspace";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateWorkspace = async (workspaceId: string, updateData: Partial<CreateWorkspaceData>) => {
    try {
      setError(null);
      const response = await fetch(`/api/workspaces/${workspaceId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      const data: ApiResponse<WorkspaceWithUsers> = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update workspace");
      }

      // Update workspace in the list
      if (data.data) {
        setWorkspaces(prev => 
          prev.map(ws => ws.id === workspaceId ? data.data! : ws)
        );
      }

      return data.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update workspace";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const deleteWorkspace = async (workspaceId: string) => {
    try {
      setError(null);
      const response = await fetch(`/api/workspaces/${workspaceId}`, {
        method: "DELETE",
      });

      const data: ApiResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete workspace");
      }

      // Remove workspace from the list
      setWorkspaces(prev => prev.filter(ws => ws.id !== workspaceId));

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete workspace";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, [session]);

  return {
    workspaces,
    isLoading,
    error,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    refetch: fetchWorkspaces,
  };
}
