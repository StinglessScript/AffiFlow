import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// Helper function to verify workspace access and link ownership
async function verifyLinkAccess(workspaceId: string, linkId: string, userId: string) {
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

  // Then verify link belongs to workspace
  const affiliateLink = await prisma.affiliateLink.findFirst({
    where: {
      id: linkId,
      workspaceId,
    },
    include: {
      product: true,
    },
  });

  if (!affiliateLink) {
    throw new Error("Affiliate link not found or access denied");
  }

  return { userWorkspace, affiliateLink };
}

// POST /api/workspaces/[id]/affiliate-links/[linkId]/set-active - Set affiliate link as active for product
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; linkId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: workspaceId, linkId } = await params;

    // Verify access
    const { affiliateLink } = await verifyLinkAccess(workspaceId, linkId, session.user.id);

    // Update product to set this link as active
    const updatedProduct = await prisma.product.update({
      where: { id: affiliateLink.productId },
      data: { activeAffiliateLinkId: linkId },
      include: {
        activeAffiliateLink: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Affiliate link set as active successfully",
      data: {
        product: updatedProduct,
        activeLink: affiliateLink,
      },
    });
  } catch (error) {
    console.error("Set active affiliate link error:", error);

    if (error instanceof Error && error.message.includes("Access denied")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/workspaces/[id]/affiliate-links/[linkId]/set-active - Remove active status
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; linkId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: workspaceId, linkId } = await params;

    // Verify access
    const { affiliateLink } = await verifyLinkAccess(workspaceId, linkId, session.user.id);

    // Only remove active status if this link is currently active
    if (affiliateLink.product.activeAffiliateLinkId === linkId) {
      await prisma.product.update({
        where: { id: affiliateLink.productId },
        data: { activeAffiliateLinkId: null },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Active status removed successfully",
    });
  } catch (error) {
    console.error("Remove active affiliate link error:", error);

    if (error instanceof Error && error.message.includes("Access denied")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
