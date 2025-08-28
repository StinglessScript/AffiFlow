import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateSlug } from "@/lib/video-utils";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const UpdatePostSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long").optional(),
  content: z.string().optional(),
  excerpt: z.string().max(300, "Excerpt too long").optional(),
  slug: z.string().optional(),
  videoUrl: z.string().url("Invalid video URL").optional(),
  videoType: z.enum(["YOUTUBE", "TIKTOK", "INSTAGRAM"]).optional(),
  thumbnail: z.string().url("Invalid thumbnail URL").optional(),
  isPublished: z.boolean().optional(),
  publishedAt: z.string().datetime().optional(),
  productIds: z.array(z.string()).optional(), // Products to tag
});

// Helper function to verify post access
async function verifyPostAccess(workspaceId: string, postId: string, userId: string) {
  // First verify workspace access
  const userWorkspace = await prisma.userWorkspace.findFirst({
    where: {
      workspaceId,
      userId,
    },
  });

  if (!userWorkspace) {
    throw new Error("Access denied to workspace");
  }

  // Then verify post belongs to workspace
  const post = await prisma.post.findFirst({
    where: {
      id: postId,
      workspaceId,
      deletedAt: null,
    },
  });

  if (!post) {
    throw new Error("Post not found or access denied");
  }

  return { userWorkspace, post };
}

// GET /api/workspaces/[id]/posts/[postId] - Get single post
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; postId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: workspaceId, postId } = params;

    // Verify access
    await verifyPostAccess(workspaceId, postId, session.user.id);

    // Get post with related data
    const post = await prisma.post.findFirst({
      where: {
        id: postId,
        workspaceId,
        deletedAt: null,
      },
      include: {
        products: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                image: true,
                price: true,
                currency: true,
                platform: true,
                affiliateUrl: true,
              },
            },
          },
          orderBy: { timestamp: 'asc' },
        },
        workspace: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: { products: true },
        },
      },
    });

    if (!post) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: post,
    });
  } catch (error) {
    console.error("Get post error:", error);

    if (error instanceof Error && error.message.includes("Access denied")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/workspaces/[id]/posts/[postId] - Update post
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; postId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: workspaceId, postId } = params;

    // Verify access
    await verifyPostAccess(workspaceId, postId, session.user.id);

    const body = await request.json();
    const { productIds, ...postData } = UpdatePostSchema.parse(body);

    // Handle slug update
    if (postData.title && !postData.slug) {
      postData.slug = generateSlug(postData.title);
    }

    // Check slug uniqueness if slug is being updated
    if (postData.slug) {
      const existingPost = await prisma.post.findFirst({
        where: {
          workspaceId,
          slug: postData.slug,
          deletedAt: null,
          NOT: { id: postId },
        },
      });

      if (existingPost) {
        postData.slug = `${postData.slug}-${Math.random().toString(36).substring(2, 8)}`;
      }
    }

    // Handle published status
    if (postData.isPublished !== undefined) {
      if (postData.isPublished && !postData.publishedAt) {
        postData.publishedAt = new Date().toISOString();
      } else if (!postData.isPublished) {
        postData.publishedAt = undefined;
      }
    }

    // Update post with products in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update post
      const post = await tx.post.update({
        where: { id: postId },
        data: {
          ...postData,
          publishedAt: postData.publishedAt ? new Date(postData.publishedAt) : undefined,
        },
      });

      // Update product associations if provided
      if (productIds !== undefined) {
        // Remove existing associations
        await tx.postProduct.deleteMany({
          where: { postId },
        });

        // Add new associations if any
        if (productIds.length > 0) {
          // Verify all products belong to the workspace
          const products = await tx.product.findMany({
            where: {
              id: { in: productIds },
              workspaceId,
            },
          });

          if (products.length !== productIds.length) {
            throw new Error("Some products not found or access denied");
          }

          // Create new post-product relationships
          await tx.postProduct.createMany({
            data: productIds.map((productId) => ({
              postId,
              productId,
            })),
          });
        }
      }

      // Return updated post with products
      return tx.post.findFirst({
        where: { id: postId },
        include: {
          products: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                  price: true,
                  currency: true,
                  platform: true,
                  affiliateUrl: true,
                },
              },
            },
            orderBy: { timestamp: 'asc' },
          },
          workspace: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          _count: {
            select: { products: true },
          },
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Post updated successfully",
      data: result,
    });
  } catch (error) {
    console.error("Update post error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message.includes("Access denied")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/workspaces/[id]/posts/[postId] - Delete post (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; postId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: workspaceId, postId } = params;

    // Verify access
    await verifyPostAccess(workspaceId, postId, session.user.id);

    // Soft delete post
    await prisma.post.update({
      where: { id: postId },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error) {
    console.error("Delete post error:", error);

    if (error instanceof Error && error.message.includes("Access denied")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
