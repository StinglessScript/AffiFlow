# Database Rules & Standards

## 🎯 Core Principles

### 1. Multi-Tenant Architecture
Every query MUST respect workspace boundaries to prevent data leakage.

```typescript
// ✅ Good - Workspace-scoped query
const posts = await prisma.post.findMany({
  where: { 
    workspaceId: userWorkspace.workspaceId,
    deletedAt: null 
  }
})

// ❌ Bad - Missing workspace filter
const posts = await prisma.post.findMany({
  where: { deletedAt: null }
})
```

### 2. Soft Deletes
Use `deletedAt` field instead of hard deletes to maintain data integrity.

```typescript
// ✅ Good - Soft delete
await prisma.post.update({
  where: { id: postId },
  data: { deletedAt: new Date() }
})

// ✅ Good - Query excluding deleted records
const activePosts = await prisma.post.findMany({
  where: { 
    workspaceId,
    deletedAt: null 
  }
})
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

### Foreign Key Relationships
```prisma
model Post {
  id          String   @id @default(cuid())
  workspaceId String   // Always include workspace reference
  
  // Relations
  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  
  @@map("posts")
}
```

## 🔍 Query Patterns

### Standard CRUD Operations

#### Create
```typescript
// ✅ Good - Include workspace validation
async function createPost(data: CreatePostData, workspaceId: string) {
  // Verify user has access to workspace
  const workspace = await prisma.workspace.findFirst({
    where: { 
      id: workspaceId,
      users: { some: { userId: data.userId } }
    }
  })
  
  if (!workspace) {
    throw new Error('Workspace not found or access denied')
  }
  
  return prisma.post.create({
    data: {
      ...data,
      workspaceId
    }
  })
}
```

#### Read
```typescript
// ✅ Good - Workspace-scoped with includes
async function getWorkspacePosts(workspaceId: string, userId: string) {
  // Verify access first
  await verifyWorkspaceAccess(workspaceId, userId)
  
  return prisma.post.findMany({
    where: { 
      workspaceId,
      deletedAt: null 
    },
    include: {
      products: {
        include: { product: true },
        where: { product: { deletedAt: null } }
      }
    },
    orderBy: { createdAt: 'desc' }
  })
}
```

#### Update
```typescript
// ✅ Good - Workspace-scoped update
async function updatePost(
  postId: string, 
  data: UpdatePostData, 
  workspaceId: string
) {
  return prisma.post.update({
    where: { 
      id: postId,
      workspaceId // Ensure post belongs to workspace
    },
    data
  })
}
```

#### Delete (Soft)
```typescript
// ✅ Good - Soft delete with workspace check
async function deletePost(postId: string, workspaceId: string) {
  return prisma.post.update({
    where: { 
      id: postId,
      workspaceId
    },
    data: { deletedAt: new Date() }
  })
}
```

### Complex Queries

#### Transactions
```typescript
// ✅ Good - Multi-step operation in transaction
async function createPostWithProducts(data: CreatePostWithProductsData) {
  return prisma.$transaction(async (tx) => {
    // Create post
    const post = await tx.post.create({
      data: {
        title: data.title,
        content: data.content,
        workspaceId: data.workspaceId
      }
    })
    
    // Create product associations
    if (data.productIds?.length) {
      await tx.postProduct.createMany({
        data: data.productIds.map(productId => ({
          postId: post.id,
          productId,
          timestamp: data.timestamps?.[productId]
        }))
      })
    }
    
    // Log analytics event
    await tx.postAnalytics.create({
      data: {
        postId: post.id,
        event: 'CREATED'
      }
    })
    
    return post
  })
}
```

#### Aggregations
```typescript
// ✅ Good - Workspace-scoped aggregation
async function getWorkspaceStats(workspaceId: string) {
  const [postCount, productCount, totalViews] = await Promise.all([
    prisma.post.count({
      where: { workspaceId, deletedAt: null }
    }),
    
    prisma.product.count({
      where: { 
        posts: { some: { post: { workspaceId } } },
        deletedAt: null 
      }
    }),
    
    prisma.postAnalytics.count({
      where: { 
        post: { workspaceId },
        event: 'VIEW'
      }
    })
  ])
  
  return { postCount, productCount, totalViews }
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

model PostAnalytics {
  // ... fields
  
  @@index([postId, event])
  @@index([createdAt])
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
    orderBy: { createdAt: 'desc' },
    include: {
      products: {
        select: { id: true, product: { select: { name: true, image: true } } }
      }
    }
  })
}

// ✅ Good - Selective field loading
async function getPostSummaries(workspaceId: string) {
  return prisma.post.findMany({
    where: { workspaceId, deletedAt: null },
    select: {
      id: true,
      title: true,
      createdAt: true,
      _count: { select: { products: true } }
    }
  })
}
```

## 🔐 Security Rules

### Access Control
```typescript
// ✅ Good - Verify workspace access
async function verifyWorkspaceAccess(workspaceId: string, userId: string) {
  const userWorkspace = await prisma.userWorkspace.findFirst({
    where: { workspaceId, userId }
  })
  
  if (!userWorkspace) {
    throw new Error('Access denied to workspace')
  }
  
  return userWorkspace
}

// ✅ Good - Role-based access
async function verifyWorkspaceRole(
  workspaceId: string, 
  userId: string, 
  requiredRole: WorkspaceRole
) {
  const userWorkspace = await verifyWorkspaceAccess(workspaceId, userId)
  
  const roleHierarchy = { MEMBER: 0, ADMIN: 1, OWNER: 2 }
  
  if (roleHierarchy[userWorkspace.role] < roleHierarchy[requiredRole]) {
    throw new Error('Insufficient permissions')
  }
  
  return userWorkspace
}
```

### Data Validation
```typescript
// ✅ Good - Validate before database operations
import { z } from 'zod'

const CreatePostSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().optional(),
  videoUrl: z.string().url().optional(),
  workspaceId: z.string().cuid()
})

async function createPost(data: unknown) {
  const validatedData = CreatePostSchema.parse(data)
  
  // Proceed with database operation
  return prisma.post.create({ data: validatedData })
}
```

## 📊 Analytics & Monitoring

### Query Monitoring
```typescript
// ✅ Good - Log slow queries
const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'stdout' }
  ]
})

prisma.$on('query', (e) => {
  if (e.duration > 1000) { // Log queries > 1s
    console.warn('Slow query detected:', {
      query: e.query,
      duration: e.duration,
      params: e.params
    })
  }
})
```

### Connection Management
```typescript
// ✅ Good - Singleton pattern for Prisma client
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
```

## 🚫 Common Mistakes to Avoid

### Anti-Patterns
```typescript
// ❌ Bad - N+1 query problem
const posts = await prisma.post.findMany({ where: { workspaceId } })
for (const post of posts) {
  const products = await prisma.postProduct.findMany({ 
    where: { postId: post.id } 
  })
}

// ✅ Good - Use includes to avoid N+1
const posts = await prisma.post.findMany({
  where: { workspaceId },
  include: { products: { include: { product: true } } }
})

// ❌ Bad - Missing workspace isolation
const post = await prisma.post.findUnique({ where: { id: postId } })

// ✅ Good - Always include workspace check
const post = await prisma.post.findFirst({
  where: { id: postId, workspaceId }
})

// ❌ Bad - Hard delete
await prisma.post.delete({ where: { id: postId } })

// ✅ Good - Soft delete
await prisma.post.update({
  where: { id: postId },
  data: { deletedAt: new Date() }
})
```

## 🧪 Testing Database Operations

### Test Data Setup
```typescript
// ✅ Good - Test with proper workspace isolation
describe('Post operations', () => {
  let testWorkspace: Workspace
  let testUser: User
  
  beforeEach(async () => {
    testUser = await prisma.user.create({
      data: { email: 'test@example.com', name: 'Test User' }
    })
    
    testWorkspace = await prisma.workspace.create({
      data: {
        name: 'Test Workspace',
        slug: 'test-workspace',
        users: {
          create: { userId: testUser.id, role: 'OWNER' }
        }
      }
    })
  })
  
  afterEach(async () => {
    await prisma.workspace.delete({ where: { id: testWorkspace.id } })
    await prisma.user.delete({ where: { id: testUser.id } })
  })
})
```
