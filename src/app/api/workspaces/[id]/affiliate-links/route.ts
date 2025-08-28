import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const CreateAffiliateLinkSchema = z.object({
  name: z.string().min(1, "Link name is required").max(100, "Name too long"),
  description: z.string().max(500, "Description too long").optional(),
  originalUrl: z.string().url("Invalid original URL"),
  affiliateUrl: z.string().url("Invalid affiliate URL"),
  platform: z
    .string()
    .min(1, "Platform is required")
    .max(50, "Platform name too long"),
  commission: z
    .number()
    .min(0, "Commission must be positive")
    .max(100, "Commission cannot exceed 100%")
    .optional(),
  commissionType: z.enum(["percentage", "fixed"]).default("percentage"),
  tags: z.string().max(200, "Tags too long").optional(),
  productId: z.string().cuid("Invalid product ID"),
});

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

// GET /api/workspaces/[id]/affiliate-links - Get all affiliate links for workspace
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: workspaceId } = await params;

    // Verify workspace access
    await verifyWorkspaceAccess(workspaceId, session.user.id);

    // Get affiliate links with product information
    const affiliateLinks = await prisma.affiliateLink.findMany({
      where: {
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
      orderBy: { createdAt: "desc" },
    });

    // Add mock stats and active status
    const linksWithStats = affiliateLinks.map((link) => ({
      ...link,
      isActive: link.product.activeAffiliateLinkId === link.id,
      _count: {
        clicks: Math.floor(Math.random() * 100), // Mock data
        conversions: Math.floor(Math.random() * 10), // Mock data
      },
    }));

    return NextResponse.json({
      success: true,
      data: linksWithStats,
    });
  } catch (error) {
    console.error("Get affiliate links error:", error);

    if (error instanceof Error && error.message.includes("Access denied")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/workspaces/[id]/affiliate-links - Create new affiliate link
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: workspaceId } = await params;

    // Verify workspace access
    await verifyWorkspaceAccess(workspaceId, session.user.id);

    const body = await request.json();
    const validatedData = CreateAffiliateLinkSchema.parse(body);

    // Verify product belongs to workspace
    const product = await prisma.product.findFirst({
      where: {
        id: validatedData.productId,
        workspaceId,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found or access denied" },
        { status: 404 }
      );
    }

    // Check if affiliate URL already exists for this product
    const existingLink = await prisma.affiliateLink.findFirst({
      where: {
        productId: validatedData.productId,
        affiliateUrl: validatedData.affiliateUrl,
      },
    });

    if (existingLink) {
      return NextResponse.json(
        { error: "Affiliate URL already exists for this product" },
        { status: 400 }
      );
    }

    // Create affiliate link
    const affiliateLink = await prisma.affiliateLink.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        originalUrl: validatedData.originalUrl,
        affiliateUrl: validatedData.affiliateUrl,
        platform: validatedData.platform,
        commission: validatedData.commission,
        commissionType: validatedData.commissionType,
        tags: validatedData.tags,
        productId: validatedData.productId,
        workspaceId,
      },
      include: {
        product: {
          select: { name: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Affiliate link created successfully",
      data: {
        ...affiliateLink,
        _count: {
          clicks: 0,
          conversions: 0,
        },
      },
    });
  } catch (error) {
    console.error("Create affiliate link error:", error);

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
