"use client";

import {
    BarChart3,
    FileText,
    LayoutDashboard,
    Package,
    Settings,
} from "lucide-react";
import * as React from "react";

import { NavMain } from "@/components/layout/nav-main";
import { NavUser } from "@/components/layout/nav-user";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarRail,
} from "@/components/ui/sidebar";
import { WorkspaceSwitcher } from "@/components/workspace/workspace-switcher";
import { useParams } from "next/navigation";

// Navigation data for AffiFlow
const getNavigationData = (workspaceSlug: string) => ({
  navMain: [
    {
      title: "Dashboard",
      url: `/${workspaceSlug}/dashboard`,
      icon: LayoutDashboard,
      isActive: true,
    },
    {
      title: "Content",
      url: "#",
      icon: FileText,
      items: [
        {
          title: "Posts",
          url: `/${workspaceSlug}/posts`,
        },
        {
          title: "Drafts",
          url: `/${workspaceSlug}/posts/drafts`,
        },
        {
          title: "Scheduled",
          url: `/${workspaceSlug}/posts/scheduled`,
        },
      ],
    },
    {
      title: "Products",
      url: "#",
      icon: Package,
      items: [
        {
          title: "All Products",
          url: `/${workspaceSlug}/products`,
        },
        {
          title: "Categories",
          url: `/${workspaceSlug}/products/categories`,
        },
        {
          title: "Affiliate Links",
          url: `/${workspaceSlug}/products/affiliate`,
        },
      ],
    },
    {
      title: "Analytics",
      url: "#",
      icon: BarChart3,
      items: [
        {
          title: "Overview",
          url: `/${workspaceSlug}/analytics`,
        },
        {
          title: "Performance",
          url: `/${workspaceSlug}/analytics/performance`,
        },
        {
          title: "Revenue",
          url: `/${workspaceSlug}/analytics/revenue`,
        },
      ],
    },
    {
      title: "Settings",
      url: "#",
      icon: Settings,
      items: [
        {
          title: "General",
          url: `/${workspaceSlug}/settings`,
        },
        {
          title: "Team",
          url: `/${workspaceSlug}/settings/team`,
        },
        {
          title: "Integrations",
          url: `/${workspaceSlug}/settings/integrations`,
        },
        {
          title: "Billing",
          url: `/${workspaceSlug}/settings/billing`,
        },
      ],
    },
  ],
});

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user?: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  currentWorkspace?: {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
  };
}

export function AppSidebar({ user, currentWorkspace, ...props }: AppSidebarProps) {
  const params = useParams();
  const workspaceSlug = params.slug as string;
  const data = getNavigationData(workspaceSlug);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <WorkspaceSwitcher currentWorkspace={currentWorkspace} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
