import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateSlug } from "@/lib/video-utils";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const CreatePostSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  content: z.string().optional(),
  excerpt: z.string().max(300, "Excerpt too long").optional(),
  slug: z.string().optional(),
  videoUrl: z.string().url("Invalid video URL").optional(),
  videoType: z.enum(["YOUTUBE", "TIKTOK", "INSTAGRAM"]).optional(),
  thumbnail: z.string().url("Invalid thumbnail URL").optional(),
  isPublished: z.boolean().default(false),
  publishedAt: z.string().datetime().optional(),
  productIds: z.array(z.string()).optional(), // Products to tag
});

const UpdatePostSchema = CreatePostSchema.partial();

// Helper function to verify workspace access
async function verifyWorkspaceAccess(workspaceId: string, userId: string) {
  const userWorkspace = await prisma.userWorkspace.findFirst({
    where: {
      workspaceId,
      userId,
    },
  });

  if (!userWorkspace) {
    throw new Error("Access denied to workspace");
  }

  return userWorkspace;
}

// GET /api/workspaces/[id]/posts - Get all posts for workspace
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

    // Verify workspace access
    await verifyWorkspaceAccess(workspaceId, session.user.id);

    // Get query parameters for pagination and filtering
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const published = searchParams.get('published');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      workspaceId,
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (published !== null && published !== undefined) {
      where.isPublished = published === 'true';
    }

    // Get posts with pagination
    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
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
                },
              },
            },
          },
          _count: {
            select: { products: true },
          },
        },
      }),
      prisma.post.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        posts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get posts error:", error);

    if (error instanceof Error && error.message.includes("Access denied")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/workspaces/[id]/posts - Create new post
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspaceId = params.id;

    // Verify workspace access
    await verifyWorkspaceAccess(workspaceId, session.user.id);

    const body = await request.json();
    const { productIds, ...postData } = CreatePostSchema.parse(body);

    // Generate slug if not provided
    let slug = postData.slug || generateSlug(postData.title);

    // Check if slug is unique within workspace
    const existingPost = await prisma.post.findFirst({
      where: {
        workspaceId,
        slug,
        deletedAt: null,
      },
    });

    if (existingPost) {
      // Add random suffix to make it unique
      slug = `${slug}-${Math.random().toString(36).substring(2, 8)}`;
    }

    // Create post with products in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create post
      const post = await tx.post.create({
        data: {
          ...postData,
          slug,
          workspaceId,
          publishedAt: postData.isPublished ? new Date() : null,
        },
      });

      // Create product associations if provided
      if (productIds && productIds.length > 0) {
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

        // Create post-product relationships
        await tx.postProduct.createMany({
          data: productIds.map((productId) => ({
            postId: post.id,
            productId,
          })),
        });
      }

      // Return post with products
      return tx.post.findFirst({
        where: { id: post.id },
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
                },
              },
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
      message: "Post created successfully",
      data: result,
    });
  } catch (error) {
    console.error("Create post error:", error);

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
