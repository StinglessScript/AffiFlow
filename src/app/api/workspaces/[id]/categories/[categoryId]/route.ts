import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const UpdateCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(50, "Name too long").optional(),
  description: z.string().max(200, "Description too long").optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid color format").optional(),
});

// Helper function to verify workspace access and category ownership
async function verifyCategoryAccess(workspaceId: string, categoryId: string, userId: string) {
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

  // Then verify category belongs to workspace
  const category = await prisma.category.findFirst({
    where: {
      id: categoryId,
      workspaceId,
    },
  });

  if (!category) {
    throw new Error("Category not found or access denied");
  }

  return { userWorkspace, category };
}

// GET /api/workspaces/[id]/categories/[categoryId] - Get single category
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; categoryId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: workspaceId, categoryId } = await params;

    // Verify access
    await verifyCategoryAccess(workspaceId, categoryId, session.user.id);

    // Get category with product count
    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        workspaceId,
      },
      include: {
        _count: {
          select: { products: true },
        },
        products: {
          select: {
            id: true,
            name: true,
            price: true,
            currency: true,
            platform: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error("Get category error:", error);

    if (error instanceof Error && error.message.includes("Access denied")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/workspaces/[id]/categories/[categoryId] - Update category
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; categoryId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: workspaceId, categoryId } = await params;

    // Verify access
    await verifyCategoryAccess(workspaceId, categoryId, session.user.id);

    const body = await request.json();
    const validatedData = UpdateCategorySchema.parse(body);

    // Check if new name already exists (if name is being updated)
    if (validatedData.name) {
      const existingCategory = await prisma.category.findFirst({
        where: {
          workspaceId,
          name: validatedData.name,
          id: { not: categoryId }, // Exclude current category
        },
      });

      if (existingCategory) {
        return NextResponse.json(
          { error: "Category name already exists" },
          { status: 400 }
        );
      }
    }

    // Update category
    const category = await prisma.category.update({
      where: { id: categoryId },
      data: validatedData,
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Category updated successfully",
      data: category,
    });
  } catch (error) {
    console.error("Update category error:", error);

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

// DELETE /api/workspaces/[id]/categories/[categoryId] - Delete category
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; categoryId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: workspaceId, categoryId } = await params;

    // Verify access
    await verifyCategoryAccess(workspaceId, categoryId, session.user.id);

    // Check if category has products
    const productCount = await prisma.product.count({
      where: { categoryId },
    });

    if (productCount > 0) {
      return NextResponse.json(
        { 
          error: "Cannot delete category", 
          message: `Category has ${productCount} product(s). Remove products from category first.` 
        },
        { status: 400 }
      );
    }

    // Delete category
    await prisma.category.delete({
      where: { id: categoryId },
    });

    return NextResponse.json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("Delete category error:", error);

    if (error instanceof Error && error.message.includes("Access denied")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
