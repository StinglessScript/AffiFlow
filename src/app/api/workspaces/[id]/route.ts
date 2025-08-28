import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isValidSlug } from "@/lib/video-utils";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const UpdateWorkspaceSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(50, "Name too long")
    .optional(),
  description: z.string().max(200, "Description too long").optional(),
  slug: z.string().optional(),
  avatar: z.string().url().optional(),
  cover: z.string().url().optional(),
  theme: z.record(z.any()).optional(),
});

async function verifyWorkspaceAccess(
  workspaceId: string,
  userId: string,
  requiredRole: "MEMBER" | "ADMIN" | "OWNER" = "MEMBER"
) {
  const userWorkspace = await prisma.userWorkspace.findFirst({
    where: { workspaceId, userId },
  });

  if (!userWorkspace) {
    throw new Error("Workspace not found or access denied");
  }

  const roleHierarchy = { MEMBER: 0, ADMIN: 1, OWNER: 2 };

  if (roleHierarchy[userWorkspace.role] < roleHierarchy[requiredRole]) {
    throw new Error("Insufficient permissions");
  }

  return userWorkspace;
}

// GET /api/workspaces/[id] - Get workspace details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspaceId = params.id;

    // Verify access
    await verifyWorkspaceAccess(workspaceId, session.user.id);

    const workspace = await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        deletedAt: null,
      },
      include: {
        users: {
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true },
            },
          },
        },
        posts: {
          where: { deletedAt: null },
          select: { id: true, title: true, createdAt: true, isPublished: true },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        _count: {
          select: {
            posts: { where: { deletedAt: null } },
          },
        },
      },
    });

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: workspace });
  } catch (error) {
    console.error("Get workspace error:", error);

    if (error instanceof Error && error.message.includes("access denied")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/workspaces/[id] - Update workspace
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspaceId = params.id;

    // Verify admin access
    await verifyWorkspaceAccess(workspaceId, session.user.id, "ADMIN");

    const body = await request.json();
    const updateData = UpdateWorkspaceSchema.parse(body);

    // Handle slug update
    if (updateData.slug) {
      if (!isValidSlug(updateData.slug)) {
        return NextResponse.json(
          { error: "Invalid slug format" },
          { status: 400 }
        );
      }

      // Check if slug is unique (excluding current workspace)
      const existingWorkspace = await prisma.workspace.findFirst({
        where: {
          slug: updateData.slug,
          id: { not: workspaceId },
        },
      });

      if (existingWorkspace) {
        return NextResponse.json(
          { error: "Slug already exists" },
          { status: 400 }
        );
      }
    }

    const workspace = await prisma.workspace.update({
      where: { id: workspaceId },
      data: updateData,
      include: {
        users: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Workspace updated successfully",
      data: workspace,
    });
  } catch (error) {
    console.error("Update workspace error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message.includes("permissions")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/workspaces/[id] - Delete workspace (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspaceId = params.id;

    // Verify owner access
    await verifyWorkspaceAccess(workspaceId, session.user.id, "OWNER");

    // Soft delete workspace
    await prisma.workspace.update({
      where: { id: workspaceId },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      message: "Workspace deleted successfully",
    });
  } catch (error) {
    console.error("Delete workspace error:", error);

    if (error instanceof Error && error.message.includes("permissions")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
