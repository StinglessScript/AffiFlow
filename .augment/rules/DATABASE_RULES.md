---
type: "always_apply"
description: "Example description"
---

# Database Rules & Standards

## 🎯 Core Principles

### 1. Multi-Tenant Architecture

Every query MUST respect workspace boundaries to prevent data leakage.

```typescript
// ✅ Good - Workspace-scoped query
const posts = await prisma.post.findMany({
  where: {
    workspaceId: userWorkspace.workspaceId,
    deletedAt: null,
  },
});

// ❌ Bad - Missing workspace filter
const posts = await prisma.post.findMany({
  where: { deletedAt: null },
});
```

### 2. Soft Deletes

Use `deletedAt` field instead of hard deletes to maintain data integrity.

```typescript
// ✅ Good - Soft delete
await prisma.post.update({
  where: { id: postId },
  data: { deletedAt: new Date() },
});

// ✅ Good - Query excluding deleted records
const activePosts = await prisma.post.findMany({
  where: {
    workspaceId,
    deletedAt: null,
  },
});
```

## 📊 Schema Design Rules

### Naming Conventions

- **Tables**: Singular, lowercase (`user`, `workspace`, `post`)
- **Fields**: camelCase in Prisma, snake_case in database
- **Relations**: Descriptive names (`userWorkspaces`, `postProducts`)
- **Indexes**: Descriptive with purpose (`idx_posts_workspace_created`)

### Required Fields for All Models

```prisma
model Example {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime? // For soft deletes

  // Model-specific fields here

  @@map("examples")
}
```

## 🔍 Query Patterns

### Standard CRUD Operations

```typescript
// ✅ Good - Include workspace validation
async function createPost(data: CreatePostData, workspaceId: string) {
  // Verify user has access to workspace
  const workspace = await prisma.workspace.findFirst({
    where: {
      id: workspaceId,
      users: { some: { userId: data.userId } },
    },
  });

  if (!workspace) {
    throw new Error("Workspace not found or access denied");
  }

  return prisma.post.create({
    data: {
      ...data,
      workspaceId,
    },
  });
}
```

### Complex Queries

```typescript
// ✅ Good - Multi-step operation in transaction
async function createPostWithProducts(data: CreatePostWithProductsData) {
  return prisma.$transaction(async (tx) => {
    // Create post
    const post = await tx.post.create({
      data: {
        title: data.title,
        content: data.content,
        workspaceId: data.workspaceId,
      },
    });

    // Create product associations
    if (data.productIds?.length) {
      await tx.postProduct.createMany({
        data: data.productIds.map((productId) => ({
          postId: post.id,
          productId,
          timestamp: data.timestamps?.[productId],
        })),
      });
    }

    return post;
  });
}
```

## 🚀 Performance Optimization

### Indexing Strategy

```prisma
model Post {
  // ... fields

  // Composite indexes for common queries
  @@index([workspaceId, createdAt])
  @@index([workspaceId, isPublished, createdAt])
  @@index([workspaceId, deletedAt])
}
```

### Query Optimization

```typescript
// ✅ Good - Efficient pagination
async function getPaginatedPosts(
  workspaceId: string,
  cursor?: string,
  limit = 10
) {
  return prisma.post.findMany({
    where: { workspaceId, deletedAt: null },
    take: limit,
    skip: cursor ? 1 : 0,
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      products: {
        select: { id: true, product: { select: { name: true, image: true } } },
      },
    },
  });
}
```

## 🔐 Security Rules

### Access Control

```typescript
// ✅ Good - Verify workspace access
async function verifyWorkspaceAccess(workspaceId: string, userId: string) {
  const userWorkspace = await prisma.userWorkspace.findFirst({
    where: { workspaceId, userId },
  });

  if (!userWorkspace) {
    throw new Error("Access denied to workspace");
  }

  return userWorkspace;
}
```

### Data Validation

```typescript
// ✅ Good - Validate before database operations
import { z } from "zod";

const CreatePostSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().optional(),
  videoUrl: z.string().url().optional(),
  workspaceId: z.string().cuid(),
});

async function createPost(data: unknown) {
  const validatedData = CreatePostSchema.parse(data);
  return prisma.post.create({ data: validatedData });
}
```

## 🚫 Common Mistakes to Avoid

### Anti-Patterns

```typescript
// ❌ Bad - N+1 query problem
const posts = await prisma.post.findMany({ where: { workspaceId } });
for (const post of posts) {
  const products = await prisma.postProduct.findMany({
    where: { postId: post.id },
  });
}

// ✅ Good - Use includes to avoid N+1
const posts = await prisma.post.findMany({
  where: { workspaceId },
  include: { products: { include: { product: true } } },
});

// ❌ Bad - Missing workspace isolation
const post = await prisma.post.findUnique({ where: { id: postId } });

// ✅ Good - Always include workspace check
const post = await prisma.post.findFirst({
  where: { id: postId, workspaceId },
});

// ❌ Bad - Hard delete
await prisma.post.delete({ where: { id: postId } });

// ✅ Good - Soft delete
await prisma.post.update({
  where: { id: postId },
  data: { deletedAt: new Date() },
});
```
