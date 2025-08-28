import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

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

// Helper function to verify product belongs to workspace
async function verifyProductAccess(productId: string, workspaceId: string) {
  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      workspaceId,
    },
  });

  if (!product) {
    throw new Error("Product not found or access denied");
  }

  return product;
}

// GET /api/workspaces/[id]/products/[productId]/affiliate-links - Get affiliate links for specific product
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

    // Verify workspace access
    await verifyWorkspaceAccess(workspaceId, session.user.id);

    // Verify product belongs to workspace
    await verifyProductAccess(productId, workspaceId);

    // Get affiliate links for this product
    const affiliateLinks = await prisma.affiliateLink.findMany({
      where: {
        productId,
        workspaceId,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: affiliateLinks,
    });
  } catch (error) {
    console.error("Get product affiliate links error:", error);

    if (error instanceof Error && error.message.includes("Access denied")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
