---
type: "always_apply"
description: "Example description"
---

# AffiFlow Development Quick Reference

## 🎯 API Standards

- **Response Format**: `{ success: boolean, data?: T, error?: string }`
- **Client Consumption**: `const { success, data, error } = await response.json()`
- **Middleware**: Always use `const { success, data: workspaces } = await response.json()`

## 🏗️ TypeScript Standards

- **Variables**: camelCase (`userName`, `createWorkspace`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_WORKSPACES`)
- **Types**: PascalCase (`UserData`, `WorkspaceConfig`)
- **Files**: kebab-case (`workspace-card.tsx`)

## 🗃️ Database Rules

- **Multi-Tenant**: Always filter by `workspaceId`
- **Soft Deletes**: Use `deletedAt: null` in queries
- **Transactions**: Use `prisma.$transaction()` for multi-step operations

```typescript
// ✅ Good - Workspace-scoped query
const posts = await prisma.post.findMany({
  where: { workspaceId, deletedAt: null },
});

// ❌ Bad - Missing workspace filter
const posts = await prisma.post.findMany({
  where: { deletedAt: null },
});
```

## 🎨 React Component Standards

- **Props**: Always define explicit interfaces
- **State**: Use typed useState
- **Error Handling**: Wrap in try-catch with user feedback

```typescript
interface ComponentProps {
  workspace: Workspace;
  onEdit?: (id: string) => void;
}

export function Component({ workspace, onEdit }: ComponentProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Component logic
}
```

## 🔄 Middleware Rules

- **API Consumption**: Use standard response format
- **Error Handling**: Always return `NextResponse.next()` on errors
- **Performance**: Keep logic simple and fast

```typescript
// ✅ Good - Correct middleware pattern
try {
  const response = await fetch(new URL("/api/workspaces", request.url));
  const { success, data: workspaces } = await response.json();

  if (success && workspaces?.length > 0) {
    // Handle redirect
  }
} catch (error) {
  console.error("Middleware error:", error);
  return NextResponse.next(); // Don't break request flow
}
```

## 🔔 User Feedback Rules

- **Toast Notifications**: Use Sonner for all user feedback
- **Loading States**: Show skeleton components during loading
- **Error States**: Provide actionable error messages
- **Empty States**: Guide users with helpful empty states

```typescript
import { toast } from "sonner";

// ✅ Good - Success feedback
toast.success("Workspace created successfully!", {
  description: "You can now start adding content",
});

// ✅ Good - Error feedback
toast.error("Failed to create workspace", {
  description: "Please try again or contact support",
});
```

## 🧪 Testing Standards

- **Unit Tests**: Test components and hooks with React Testing Library
- **API Tests**: Test all endpoints with proper mocking
- **E2E Tests**: Test critical user journeys with Playwright
- **Database Tests**: Test with proper workspace isolation

```typescript
// ✅ Good - Component test
describe("WorkspaceCard", () => {
  it("should display workspace name", () => {
    render(<WorkspaceCard workspace={mockWorkspace} />);
    expect(screen.getByText(mockWorkspace.name)).toBeInTheDocument();
  });
});
```

## 🚫 Common Anti-Patterns to Avoid

### API & Database

```typescript
// ❌ Bad - Inconsistent API response
return NextResponse.json({ workspaces }); // Use { success: true, data: workspaces }

// ❌ Bad - Missing workspace isolation
const posts = await prisma.post.findMany(); // Add workspaceId filter

// ❌ Bad - Hard delete
await prisma.post.delete({ where: { id } }); // Use soft delete
```

### Components & State

```typescript
// ❌ Bad - Any types
function Component({ data }: { data: any }) {} // Define proper interface

// ❌ Bad - Missing error handling
const handleSubmit = async () => {
  await submitForm(); // No try-catch or user feedback
};

// ❌ Bad - No loading state
return <div>{data?.map(...)}</div>; // Show skeleton while loading
```

### Middleware & Routing

```typescript
// ❌ Bad - Wrong API consumption
const { workspaces } = await response.json(); // Use { success, data: workspaces }

// ❌ Bad - No error handling
const response = await fetch("/api/workspaces");
const data = await response.json(); // What if fetch fails?
```

## 📋 Development Checklist

Before submitting any code:

### Code Quality

- [ ] All TypeScript errors resolved
- [ ] Proper error handling implemented
- [ ] User feedback provided (toasts, loading states)
- [ ] Workspace isolation maintained
- [ ] No hardcoded values

### API & Database

- [ ] API follows standard response format
- [ ] Database queries include workspace filtering
- [ ] Soft deletes used where appropriate
- [ ] Transactions used for multi-step operations

### Components & UI

- [ ] Props interfaces defined
- [ ] Loading and error states handled
- [ ] Accessibility considerations addressed
- [ ] Responsive design implemented

### Testing

- [ ] Unit tests written for new components
- [ ] API endpoints tested
- [ ] Critical user flows covered by E2E tests
- [ ] Database operations tested with workspace isolation

### Performance

- [ ] No N+1 query problems
- [ ] Efficient pagination implemented
- [ ] Minimal data fetching in middleware
- [ ] Proper indexing for database queries

## 🎯 Key Principles

1. **Multi-Tenancy First**: Every feature must respect workspace boundaries
2. **Type Safety**: Use TypeScript properly with explicit interfaces
3. **User Experience**: Always provide feedback for user actions
4. **Error Resilience**: Handle errors gracefully without breaking user flow
5. **Performance**: Keep operations fast and efficient
6. **Testing**: Write tests that provide confidence in the system
7. **Consistency**: Follow established patterns and conventions
