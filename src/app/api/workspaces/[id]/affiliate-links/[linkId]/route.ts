import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const UpdateAffiliateLinkSchema = z.object({
  name: z
    .string()
    .min(1, "Link name is required")
    .max(100, "Name too long")
    .optional(),
  description: z.string().max(500, "Description too long").optional(),
  originalUrl: z.string().url("Invalid original URL").optional(),
  affiliateUrl: z.string().url("Invalid affiliate URL").optional(),
  platform: z
    .string()
    .min(1, "Platform is required")
    .max(50, "Platform name too long")
    .optional(),
  commission: z
    .number()
    .min(0, "Commission must be positive")
    .max(100, "Commission cannot exceed 100%")
    .optional(),
  commissionType: z.enum(["percentage", "fixed"]).optional(),
  tags: z.string().max(200, "Tags too long").optional(),
  productId: z.string().cuid("Invalid product ID").optional(),
});

// Helper function to verify workspace access and link ownership
async function verifyLinkAccess(
  workspaceId: string,
  linkId: string,
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

  // Then verify link belongs to workspace
  const affiliateLink = await prisma.affiliateLink.findFirst({
    where: {
      id: linkId,
      workspaceId,
    },
  });

  if (!affiliateLink) {
    throw new Error("Affiliate link not found or access denied");
  }

  return { userWorkspace, affiliateLink };
}

// GET /api/workspaces/[id]/affiliate-links/[linkId] - Get single affiliate link
export async function GET(
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
    await verifyLinkAccess(workspaceId, linkId, session.user.id);

    // Get affiliate link with product info
    const affiliateLink = await prisma.affiliateLink.findFirst({
      where: {
        id: linkId,
        workspaceId,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            image: true,
            activeAffiliateLinkId: true,
          },
        },
      },
    });

    if (!affiliateLink) {
      return NextResponse.json(
        { error: "Affiliate link not found" },
        { status: 404 }
      );
    }

    // Add mock stats and active status
    const linkWithStats = {
      ...affiliateLink,
      isActive:
        affiliateLink.product.activeAffiliateLinkId === affiliateLink.id,
      _count: {
        clicks: Math.floor(Math.random() * 100),
        conversions: Math.floor(Math.random() * 10),
      },
    };

    return NextResponse.json({
      success: true,
      data: linkWithStats,
    });
  } catch (error) {
    console.error("Get affiliate link error:", error);

    if (error instanceof Error && error.message.includes("Access denied")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/workspaces/[id]/affiliate-links/[linkId] - Update affiliate link
export async function PUT(
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
    await verifyLinkAccess(workspaceId, linkId, session.user.id);

    const body = await request.json();
    const validatedData = UpdateAffiliateLinkSchema.parse(body);

    // Check if new affiliate URL already exists (if URL is being updated)
    if (validatedData.affiliateUrl) {
      const existingLink = await prisma.affiliateLink.findFirst({
        where: {
          workspaceId,
          affiliateUrl: validatedData.affiliateUrl,
          id: { not: linkId }, // Exclude current link
        },
      });

      if (existingLink) {
        return NextResponse.json(
          { error: "Affiliate URL already exists" },
          { status: 400 }
        );
      }
    }

    // Update affiliate link
    const affiliateLink = await prisma.affiliateLink.update({
      where: { id: linkId },
      data: validatedData,
    });

    return NextResponse.json({
      success: true,
      message: "Affiliate link updated successfully",
      data: {
        ...affiliateLink,
        _count: {
          clicks: Math.floor(Math.random() * 100),
          conversions: Math.floor(Math.random() * 10),
        },
      },
    });
  } catch (error) {
    console.error("Update affiliate link error:", error);

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

// DELETE /api/workspaces/[id]/affiliate-links/[linkId] - Delete affiliate link
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
    await verifyLinkAccess(workspaceId, linkId, session.user.id);

    // Delete affiliate link
    await prisma.affiliateLink.delete({
      where: { id: linkId },
    });

    return NextResponse.json({
      success: true,
      message: "Affiliate link deleted successfully",
    });
  } catch (error) {
    console.error("Delete affiliate link error:", error);

    if (error instanceof Error && error.message.includes("Access denied")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
