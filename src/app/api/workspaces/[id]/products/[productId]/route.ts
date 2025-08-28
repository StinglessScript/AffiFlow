import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const UpdateProductSchema = z.object({
  name: z
    .string()
    .min(1, "Product name is required")
    .max(100, "Name too long")
    .optional(),
  description: z.string().max(500, "Description too long").optional(),
  image: z
    .string()
    .optional()
    .refine((val) => !val || z.string().url().safeParse(val).success, {
      message: "Invalid image URL",
    }),
  price: z.number().min(0, "Price must be positive").optional(),
  currency: z.string().length(3, "Currency must be 3 characters").optional(),
  affiliateUrl: z.string().url("Invalid affiliate URL").optional(),
  platform: z.string().max(50, "Platform name too long").optional(),
  categoryId: z
    .string()
    .optional()
    .refine((val) => !val || z.string().cuid().safeParse(val).success, {
      message: "Invalid category ID",
    }),
  activeAffiliateLinkId: z
    .string()
    .optional()
    .refine((val) => !val || z.string().cuid().safeParse(val).success, {
      message: "Invalid affiliate link ID",
    }),
});

// Helper function to verify workspace access and product ownership
async function verifyProductAccess(
  workspaceId: string,
  productId: string,
  userId: string
) {
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

  // Then verify product belongs to workspace
  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      workspaceId,
    },
  });

  if (!product) {
    throw new Error("Product not found or access denied");
  }

  return { userWorkspace, product };
}

// Helper function to detect platform from URL
function detectPlatform(url: string): string {
  if (url.includes("shopee.vn") || url.includes("shopee.com")) return "shopee";
  if (url.includes("lazada.vn") || url.includes("lazada.com")) return "lazada";
  if (url.includes("tiki.vn")) return "tiki";
  if (url.includes("amazon.com") || url.includes("amazon.vn")) return "amazon";
  if (url.includes("sendo.vn")) return "sendo";
  return "other";
}

// GET /api/workspaces/[id]/products/[productId] - Get single product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; productId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: workspaceId, productId } = await params;

    // Verify access
    await verifyProductAccess(workspaceId, productId, session.user.id);

    // Get product with related data
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        workspaceId,
      },
      include: {
        posts: {
          include: {
            post: {
              select: {
                id: true,
                title: true,
                slug: true,
                thumbnail: true,
                isPublished: true,
                createdAt: true,
              },
            },
          },
        },
        _count: {
          select: { posts: true },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("Get product error:", error);

    if (error instanceof Error && error.message.includes("Access denied")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/workspaces/[id]/products/[productId] - Update product
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; productId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: workspaceId, productId } = await params;

    // Verify access
    await verifyProductAccess(workspaceId, productId, session.user.id);

    const body = await request.json();
    const validatedData = UpdateProductSchema.parse(body);

    // Auto-detect platform if affiliateUrl is being updated
    const updateData: any = { ...validatedData };
    if (validatedData.affiliateUrl && !validatedData.platform) {
      updateData.platform = detectPlatform(validatedData.affiliateUrl);
    }

    // Filter out empty optional fields
    if (!updateData.categoryId) {
      delete updateData.categoryId;
    }

    if (!updateData.activeAffiliateLinkId) {
      delete updateData.activeAffiliateLinkId;
    }

    // Update product
    const product = await prisma.product.update({
      where: { id: productId },
      data: updateData,
      include: {
        posts: {
          include: {
            post: {
              select: {
                id: true,
                title: true,
                slug: true,
                thumbnail: true,
                isPublished: true,
                createdAt: true,
              },
            },
          },
        },
        _count: {
          select: { posts: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Product updated successfully",
      data: product,
    });
  } catch (error) {
    console.error("Update product error:", error);

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

// DELETE /api/workspaces/[id]/products/[productId] - Delete product
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; productId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: workspaceId, productId } = await params;

    // Verify access
    await verifyProductAccess(workspaceId, productId, session.user.id);

    // Check if product is used in any posts
    const postCount = await prisma.postProduct.count({
      where: { productId },
    });

    if (postCount > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete product",
          message: `Product is used in ${postCount} post(s). Remove from posts first.`,
        },
        { status: 400 }
      );
    }

    // Delete product
    await prisma.product.delete({
      where: { id: productId },
    });

    return NextResponse.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Delete product error:", error);

    if (error instanceof Error && error.message.includes("Access denied")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
