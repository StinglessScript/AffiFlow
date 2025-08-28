"use client";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useCurrentWorkspace } from "@/hooks/use-current-workspace";
import { useSession } from "next-auth/react";
import { AppSidebar } from "./app-sidebar";
import { WorkspaceHeader } from "./workspace-header";

interface WorkspaceLayoutProps {
  children: React.ReactNode;
}

export function WorkspaceLayout({ children }: WorkspaceLayoutProps) {
  const { data: session } = useSession();
  const { workspace, isLoading } = useCurrentWorkspace();

  if (!session?.user) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="animate-pulse">
          <div className="h-16 bg-white border-b border-gray-200" />
          <div className="flex">
            <div className="w-64 h-screen bg-gray-50 border-r border-gray-200" />
            <div className="flex-1 p-6">
              <div className="space-y-4">
                <div className="h-8 bg-gray-200 rounded w-1/4" />
                <div className="h-64 bg-gray-200 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar
        user={session.user}
        currentWorkspace={workspace}
      />
      <SidebarInset>
        <WorkspaceHeader
          user={session.user}
          currentWorkspace={workspace}
        />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
