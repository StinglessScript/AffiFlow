import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateSlug, isValidSlug } from "@/lib/video-utils";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const CreateWorkspaceSchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name too long"),
  description: z.string().max(200, "Description too long").optional(),
  slug: z.string().optional(),
});

// GET /api/workspaces - Get user's workspaces
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspaces = await prisma.workspace.findMany({
      where: {
        users: {
          some: { userId: session.user.id },
        },
        deletedAt: null,
      },
      include: {
        users: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        _count: {
          select: { posts: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: workspaces });
  } catch (error) {
    console.error("Get workspaces error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/workspaces - Create new workspace
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      slug: providedSlug,
    } = CreateWorkspaceSchema.parse(body);

    // Generate or validate slug
    let slug = providedSlug || generateSlug(name);

    if (!isValidSlug(slug)) {
      slug = generateSlug(name);
    }

    // Check if slug is unique
    const existingWorkspace = await prisma.workspace.findUnique({
      where: { slug },
    });

    if (existingWorkspace) {
      // Add random suffix to make it unique
      slug = `${slug}-${Math.random().toString(36).substring(2, 8)}`;
    }

    // Create workspace with user as owner
    const workspace = await prisma.workspace.create({
      data: {
        name,
        description,
        slug,
        users: {
          create: {
            userId: session.user.id,
            role: "OWNER",
          },
        },
      },
      include: {
        users: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Workspace created successfully",
      data: workspace,
    });
  } catch (error) {
    console.error("Create workspace error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
