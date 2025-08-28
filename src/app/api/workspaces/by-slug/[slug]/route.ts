import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;

    // Find workspace by slug and verify user has access
    const workspace = await prisma.workspace.findFirst({
      where: {
        slug,
        deletedAt: null,
        users: {
          some: {
            userId: session.user.id,
          },
        },
      },
      include: {
        users: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            posts: {
              where: { deletedAt: null },
            },
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

    // Get user's role in this workspace
    const userWorkspace = workspace.users.find(
      (uw) => uw.userId === session.user.id
    );

    const workspaceData = {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      description: workspace.description,
      createdAt: workspace.createdAt,
      updatedAt: workspace.updatedAt,
      role: userWorkspace?.role,
      memberCount: workspace.users.length,
      postCount: workspace._count.posts,
    };

    return NextResponse.json({
      success: true,
      data: workspaceData,
    });
  } catch (error) {
    console.error("Get workspace by slug error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
