"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateWorkspaceForm } from "@/components/workspace/create-workspace-form";
import { BarChart3, Building, FileText } from "lucide-react";
import { useSession } from "next-auth/react";

export default function DashboardPage() {
  const { data: session } = useSession();

  // This page is only for onboarding (users with no workspaces)
  // Middleware handles auto-redirect for users with existing workspaces

  // Onboarding for users with no workspaces
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Welcome Section */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome to AffiFlow, {session?.user?.name}!
            </h1>
            <p className="text-xl text-gray-600">
              Let's create your first workspace to start sharing content and earning through affiliate marketing.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Create Content</h3>
              <p className="text-gray-600">Share videos, posts, and stories with your audience</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Add Products</h3>
              <p className="text-gray-600">Integrate affiliate products into your content</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Earn Revenue</h3>
              <p className="text-gray-600">Track performance and earn from affiliate sales</p>
            </div>
          </div>

          {/* CTA Section */}
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Create Your First Workspace</CardTitle>
              <CardDescription className="text-lg">
                A workspace is your content channel where you'll share videos, posts, and affiliate products.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-6">
              <CreateWorkspaceForm />
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-2">Need help getting started?</p>
                <Button variant="outline">
                  Watch Tutorial
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
