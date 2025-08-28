import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const CreateProductSchema = z.object({
  name: z.string().min(1, "Product name is required").max(100, "Name too long"),
  description: z.string().max(500, "Description too long").optional(),
  image: z
    .string()
    .optional()
    .refine((val) => !val || z.string().url().safeParse(val).success, {
      message: "Invalid image URL",
    }),
  price: z.number().min(0, "Price must be positive").optional(),
  currency: z
    .string()
    .length(3, "Currency must be 3 characters")
    .default("VND"),
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

const UpdateProductSchema = CreateProductSchema.partial();

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

// GET /api/workspaces/[id]/products - Get all products for workspace
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

    // Get query parameters for pagination and filtering
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      workspaceId,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // Get products with pagination
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          posts: {
            select: {
              id: true,
              post: {
                select: { id: true, title: true, slug: true },
              },
            },
          },
          _count: {
            select: { posts: true },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        products,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get products error:", error);

    if (error instanceof Error && error.message.includes("Access denied")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/workspaces/[id]/products - Create new product
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
    const validatedData = CreateProductSchema.parse(body);

    // Filter out empty categoryId to avoid foreign key constraint violation
    const productData = {
      ...validatedData,
      workspaceId,
    };

    if (!productData.categoryId) {
      delete productData.categoryId;
    }

    if (!productData.activeAffiliateLinkId) {
      delete productData.activeAffiliateLinkId;
    }

    // Create product
    const product = await prisma.product.create({
      data: productData,
      include: {
        _count: {
          select: { posts: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  } catch (error) {
    console.error("Create product error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
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
