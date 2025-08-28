"use client";

import Link from "next/link";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { 
  MoreHorizontal, 
  Settings, 
  ExternalLink, 
  Trash2, 
  Users, 
  FileText,
  Calendar
} from "lucide-react";
import { WorkspaceWithUsers } from "@/types";
import { useWorkspaces } from "@/hooks/use-workspaces";
import { formatDistanceToNow } from "date-fns";

interface WorkspaceCardProps {
  workspace: WorkspaceWithUsers;
}

export function WorkspaceCard({ workspace }: WorkspaceCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { deleteWorkspace } = useWorkspaces();

  const userRole = workspace.users[0]?.role || "MEMBER";
  const postCount = workspace._count?.posts || 0;
  const memberCount = workspace.users.length;

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this workspace? This action cannot be undone.")) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteWorkspace(workspace.id);
    } catch (error) {
      console.error("Delete workspace error:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "OWNER":
        return "bg-blue-100 text-blue-800";
      case "ADMIN":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{workspace.name}</CardTitle>
            <CardDescription className="mt-1">
              {workspace.description || "No description"}
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge className={getRoleBadgeColor(userRole)}>
              {userRole}
            </Badge>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/dashboard/workspaces/${workspace.id}`}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/${workspace.slug}`} target="_blank">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View Public Page
                  </Link>
                </DropdownMenuItem>
                {userRole === "OWNER" && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {isDeleting ? "Deleting..." : "Delete"}
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-3 gap-4 text-sm text-gray-600 mb-4">
          <div className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            <span>{postCount} posts</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{memberCount} members</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{formatDistanceToNow(new Date(workspace.createdAt), { addSuffix: true })}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button asChild className="flex-1">
            <Link href={`/dashboard/workspaces/${workspace.id}`}>
              Manage
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/dashboard/workspaces/${workspace.id}/posts`}>
              Posts
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
