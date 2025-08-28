---
type: "agent_requested"
description: "TypeScript standards, naming conventions, and code organization"
---

# Coding Standards

## 🎯 TypeScript Standards

### Type Definitions

```typescript
// ✅ Good - Explicit interface
interface CreateWorkspaceData {
  name: string;
  slug: string;
  description?: string;
}

// ❌ Bad - Using any
function createWorkspace(data: any) {}

// ✅ Good - Proper typing
function createWorkspace(data: CreateWorkspaceData): Promise<Workspace> {}
```

### Naming Conventions

- **Variables & Functions**: camelCase (`userName`, `createWorkspace`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_WORKSPACES`, `API_BASE_URL`)
- **Types & Interfaces**: PascalCase (`UserData`, `WorkspaceConfig`)
- **Components**: PascalCase (`WorkspaceCard`, `VideoPlayer`)
- **Files**: kebab-case (`workspace-card.tsx`, `video-utils.ts`)

## 📁 File Organization

### Import Order

1. React imports
2. Third-party libraries
3. Internal components (UI first)
4. Utils and hooks
5. Types
6. Relative imports

## 🔧 Function Standards

```typescript
// ✅ Good - Arrow function for utilities
export const generateSlug = (title: string): string => {
  return title.toLowerCase().replace(/\s+/g, "-");
};

// ✅ Good - Function declaration for components
export function WorkspaceSettings({ workspace }: Props) {
  return <div>...</div>;
}

// ✅ Good - Async function with proper error handling
export async function createWorkspace(data: CreateWorkspaceData) {
  try {
    const workspace = await prisma.workspace.create({ data });
    return { success: true, data: workspace };
  } catch (error) {
    console.error("Failed to create workspace:", error);
    return { success: false, error: "Failed to create workspace" };
  }
}
```

### Error Handling

```typescript
// ✅ Good - Structured error handling
async function fetchWorkspaces(userId: string) {
  try {
    const workspaces = await prisma.workspace.findMany({
      where: { users: { some: { userId } } },
    });
    return { data: workspaces, error: null };
  } catch (error) {
    console.error("Database error:", error);
    return { data: null, error: "Failed to fetch workspaces" };
  }
}

// ✅ Good - Client-side error handling
function WorkspaceList() {
  const [error, setError] = useState<string | null>(null);

  const handleCreateWorkspace = async (data: CreateWorkspaceData) => {
    try {
      setError(null);
      await createWorkspace(data);
    } catch (err) {
      setError("Failed to create workspace. Please try again.");
    }
  };
}
```

## 🎨 React Component Standards

```typescript
// ✅ Good - Explicit props interface
interface VideoPlayerProps {
  videoUrl: string;
  autoplay?: boolean;
  onTimeUpdate?: (time: number) => void;
  className?: string;
}

// ✅ Good - Default props with destructuring
export function VideoPlayer({
  videoUrl,
  autoplay = false,
  onTimeUpdate,
  className,
}: VideoPlayerProps) {
  // Component logic
}
```

## 🗃️ Database Query Standards

```typescript
// ✅ Good - Workspace-scoped query
async function getWorkspacePosts(workspaceId: string) {
  return prisma.post.findMany({
    where: {
      workspaceId,
      deletedAt: null,
    },
    include: {
      products: {
        include: { product: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}
```

## 🚫 Common Anti-Patterns to Avoid

```typescript
// ❌ Bad - Any types
function processData(data: any): any {}

// ❌ Bad - Missing error handling
async function fetchData() {
  const response = await fetch("/api/data");
  return response.json(); // What if this fails?
}

// ❌ Bad - Missing workspace isolation
const posts = await prisma.post.findMany(); // Missing workspaceId filter!
```

## 🔍 Code Review Checklist

- [ ] All variables and functions properly typed
- [ ] Error handling implemented
- [ ] Workspace isolation maintained
- [ ] No hardcoded values
- [ ] Proper naming conventions followed
- [ ] Comments explain complex logic
- [ ] No console.logs in production code
- [ ] Performance considerations addressed
