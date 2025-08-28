"use client";

import { Building2, ChevronsUpDown, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { CreateWorkspaceForm } from "@/components/workspace/create-workspace-form";
import { useWorkspaces } from "@/hooks/use-workspaces";

interface Workspace {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
}

interface WorkspaceSwitcherProps {
  currentWorkspace?: Workspace;
}

export function WorkspaceSwitcher({ currentWorkspace }: WorkspaceSwitcherProps) {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const { workspaces, isLoading, refetch } = useWorkspaces();
  const [showCreateForm, setShowCreateForm] = React.useState(false);

  const handleWorkspaceSwitch = (workspace: Workspace) => {
    router.push(`/${workspace.slug}/dashboard`);
  };

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
    refetch();
  };

  if (isLoading || !currentWorkspace) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" className="animate-pulse">
            <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
              <div className="size-4 bg-gray-300 rounded" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <div className="h-4 bg-gray-300 rounded w-24" />
              <div className="h-3 bg-gray-200 rounded w-16 mt-1" />
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Building2 className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{currentWorkspace.name}</span>
                  <span className="truncate text-xs">{currentWorkspace.slug}</span>
                </div>
                <ChevronsUpDown className="ml-auto" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
              align="start"
              side={isMobile ? "bottom" : "right"}
              sideOffset={4}
            >
              <DropdownMenuLabel className="text-muted-foreground text-xs">
                Workspaces
              </DropdownMenuLabel>
              {workspaces?.map((workspace, index) => (
                <DropdownMenuItem
                  key={workspace.id}
                  onClick={() => handleWorkspaceSwitch(workspace)}
                  className="gap-2 p-2"
                >
                  <div className="flex size-6 items-center justify-center rounded-md border">
                    <Building2 className="size-3.5 shrink-0" />
                  </div>
                  {workspace.name}
                  <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="gap-2 p-2"
                onClick={() => setShowCreateForm(true)}
              >
                <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                  <Plus className="size-4" />
                </div>
                <div className="text-muted-foreground font-medium">Add workspace</div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      {/* Create Workspace Modal */}
      {showCreateForm && (
        <CreateWorkspaceForm
          open={showCreateForm}
          onOpenChange={setShowCreateForm}
          onSuccess={handleCreateSuccess}
          onCancel={() => setShowCreateForm(false)}
          hideTrigger={true}
        />
      )}
    </>
  );
}
