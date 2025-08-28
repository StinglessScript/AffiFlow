# Coding Standards

## 🎯 TypeScript Standards

### Type Definitions
```typescript
// ✅ Good - Explicit interface
interface CreateWorkspaceData {
  name: string
  slug: string
  description?: string
}

// ❌ Bad - Using any
function createWorkspace(data: any) { }

// ✅ Good - Proper typing
function createWorkspace(data: CreateWorkspaceData): Promise<Workspace> { }
```

### Naming Conventions
- **Variables & Functions**: camelCase (`userName`, `createWorkspace`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_WORKSPACES`, `API_BASE_URL`)
- **Types & Interfaces**: PascalCase (`UserData`, `WorkspaceConfig`)
- **Components**: PascalCase (`WorkspaceCard`, `VideoPlayer`)
- **Files**: kebab-case (`workspace-card.tsx`, `video-utils.ts`)

## 📁 File Organization

### Component Structure
```typescript
// workspace-card.tsx
import { Card } from "@/components/ui/card"
import { Workspace } from "@/types"

interface WorkspaceCardProps {
  workspace: Workspace
  onEdit?: (id: string) => void
}

export function WorkspaceCard({ workspace, onEdit }: WorkspaceCardProps) {
  // Component logic here
  return (
    <Card>
      {/* JSX here */}
    </Card>
  )
}
```

### Import Order
1. React imports
2. Third-party libraries
3. Internal components (UI first)
4. Utils and hooks
5. Types
6. Relative imports

```typescript
import React from "react"
import { NextPage } from "next"
import { Button } from "@/components/ui/button"
import { WorkspaceCard } from "@/components/workspace/workspace-card"
import { useWorkspaces } from "@/hooks/use-workspaces"
import { Workspace } from "@/types"
import "./styles.css"
```

## 🔧 Function Standards

### Function Declarations
```typescript
// ✅ Good - Arrow function for utilities
export const generateSlug = (title: string): string => {
  return title.toLowerCase().replace(/\s+/g, '-')
}

// ✅ Good - Function declaration for components
export function WorkspaceSettings({ workspace }: Props) {
  return <div>...</div>
}

// ✅ Good - Async function with proper error handling
export async function createWorkspace(data: CreateWorkspaceData) {
  try {
    const workspace = await prisma.workspace.create({ data })
    return { success: true, data: workspace }
  } catch (error) {
    console.error('Failed to create workspace:', error)
    return { success: false, error: 'Failed to create workspace' }
  }
}
```

### Error Handling
```typescript
// ✅ Good - Structured error handling
async function fetchWorkspaces(userId: string) {
  try {
    const workspaces = await prisma.workspace.findMany({
      where: { users: { some: { userId } } }
    })
    return { data: workspaces, error: null }
  } catch (error) {
    console.error('Database error:', error)
    return { data: null, error: 'Failed to fetch workspaces' }
  }
}

// ✅ Good - Client-side error handling
function WorkspaceList() {
  const [error, setError] = useState<string | null>(null)
  
  const handleCreateWorkspace = async (data: CreateWorkspaceData) => {
    try {
      setError(null)
      await createWorkspace(data)
    } catch (err) {
      setError('Failed to create workspace. Please try again.')
    }
  }
}
```

## 🎨 React Component Standards

### Component Props
```typescript
// ✅ Good - Explicit props interface
interface VideoPlayerProps {
  videoUrl: string
  autoplay?: boolean
  onTimeUpdate?: (time: number) => void
  className?: string
}

// ✅ Good - Default props with destructuring
export function VideoPlayer({ 
  videoUrl, 
  autoplay = false, 
  onTimeUpdate,
  className 
}: VideoPlayerProps) {
  // Component logic
}
```

### State Management
```typescript
// ✅ Good - Typed state
const [workspace, setWorkspace] = useState<Workspace | null>(null)
const [loading, setLoading] = useState(false)
const [error, setError] = useState<string | null>(null)

// ✅ Good - State updates
const handleUpdateWorkspace = (updates: Partial<Workspace>) => {
  setWorkspace(prev => prev ? { ...prev, ...updates } : null)
}
```

### Event Handlers
```typescript
// ✅ Good - Typed event handlers
const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault()
  // Handle form submission
}

const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setValue(e.target.value)
}
```

## 🗃️ Database Query Standards

### Prisma Queries
```typescript
// ✅ Good - Workspace-scoped query
async function getWorkspacePosts(workspaceId: string) {
  return prisma.post.findMany({
    where: { 
      workspaceId,
      deletedAt: null 
    },
    include: {
      products: {
        include: { product: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })
}

// ✅ Good - Transaction for multiple operations
async function createPostWithProducts(data: CreatePostData) {
  return prisma.$transaction(async (tx) => {
    const post = await tx.post.create({ data: postData })
    
    if (data.productIds?.length) {
      await tx.postProduct.createMany({
        data: data.productIds.map(productId => ({
          postId: post.id,
          productId
        }))
      })
    }
    
    return post
  })
}
```

## 📝 Documentation Standards

### JSDoc Comments
```typescript
/**
 * Parses a video URL and extracts embed information
 * @param url - The video URL to parse (YouTube, TikTok, Instagram)
 * @returns Video embed data or null if URL is invalid
 * @example
 * ```typescript
 * const embedData = parseVideoUrl('https://youtube.com/watch?v=abc123')
 * if (embedData) {
 *   console.log(embedData.embedUrl)
 * }
 * ```
 */
export function parseVideoUrl(url: string): VideoEmbedData | null {
  // Implementation
}
```

### Code Comments
```typescript
// ✅ Good - Explain WHY, not WHAT
// We need to debounce the search to avoid excessive API calls
const debouncedSearch = useMemo(
  () => debounce(searchWorkspaces, 300),
  []
)

// ✅ Good - Complex business logic explanation
// Calculate commission based on product price and workspace tier
// Free tier: 5%, Basic: 7%, Pro: 10%
const commission = calculateCommission(product.price, workspace.tier)
```

## 🚫 Common Anti-Patterns to Avoid

### Don't Do This
```typescript
// ❌ Bad - Any types
function processData(data: any): any { }

// ❌ Bad - Mutating props
function Component({ items }: { items: Item[] }) {
  items.push(newItem) // Don't mutate props!
}

// ❌ Bad - Missing error handling
async function fetchData() {
  const response = await fetch('/api/data')
  return response.json() // What if this fails?
}

// ❌ Bad - Hardcoded values
const API_URL = 'http://localhost:3000/api' // Use env vars!

// ❌ Bad - Missing workspace isolation
const posts = await prisma.post.findMany() // Missing workspaceId filter!
```

### Do This Instead
```typescript
// ✅ Good - Proper typing
function processData(data: ProcessableData): ProcessedResult { }

// ✅ Good - Immutable updates
function Component({ items }: { items: Item[] }) {
  const [localItems, setLocalItems] = useState(items)
  const addItem = (item: Item) => setLocalItems(prev => [...prev, item])
}

// ✅ Good - Error handling
async function fetchData(): Promise<{ data: Data | null, error: string | null }> {
  try {
    const response = await fetch('/api/data')
    if (!response.ok) throw new Error('Failed to fetch')
    const data = await response.json()
    return { data, error: null }
  } catch (error) {
    return { data: null, error: 'Failed to fetch data' }
  }
}

// ✅ Good - Environment variables
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

// ✅ Good - Workspace isolation
const posts = await prisma.post.findMany({
  where: { workspaceId }
})
```

## 🔍 Code Review Checklist

Before submitting code:
- [ ] All variables and functions properly typed
- [ ] Error handling implemented
- [ ] Workspace isolation maintained
- [ ] No hardcoded values
- [ ] Proper naming conventions followed
- [ ] Comments explain complex logic
- [ ] No console.logs in production code
- [ ] Performance considerations addressed
