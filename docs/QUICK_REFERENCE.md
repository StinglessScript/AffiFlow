# AffiFlow Quick Reference Guide

## 🚀 Getting Started Checklist

### Before Writing Any Code
- [ ] Read relevant rules in `docs/rules/`
- [ ] Check existing patterns in codebase
- [ ] Ensure TypeScript is properly configured
- [ ] Verify database connection is working

### For New Features
- [ ] Design with multi-tenant architecture in mind
- [ ] Plan database schema changes (if needed)
- [ ] Consider workspace isolation requirements
- [ ] Design UI with shadcn/ui components

## 📋 Essential Rules Summary

### 🏗️ Architecture
- **Multi-tenant first**: Every feature must support multiple workspaces
- **TypeScript everywhere**: No `any` types, proper interfaces
- **Workspace isolation**: Always filter by `workspaceId`
- **Soft deletes**: Use `deletedAt` instead of hard deletes

### 🎨 UI/UX
- **shadcn/ui foundation**: Don't modify, extend with composition
- **Mobile-first**: Design for mobile, enhance for desktop
- **Accessibility**: ARIA labels, keyboard navigation, screen readers
- **Loading states**: Skeletons, error boundaries, empty states

### 🗃️ Database
- **Prisma ORM**: All database operations through Prisma
- **Transactions**: Multi-step operations in transactions
- **Indexing**: Add indexes for performance-critical queries
- **Validation**: Zod schemas for all user inputs

### 🔐 Security
- **NextAuth.js**: All authentication through NextAuth
- **Permission checks**: Verify workspace access on every operation
- **Input validation**: Validate and sanitize all inputs
- **Environment variables**: No hardcoded secrets

## 🛠️ Common Patterns

### Component Structure
```typescript
interface ComponentProps {
  // Required props first
  workspace: Workspace
  // Optional props with defaults
  variant?: "default" | "compact"
  className?: string
  // Event handlers
  onUpdate?: (data: UpdateData) => void
}

export function Component({ 
  workspace, 
  variant = "default", 
  className,
  onUpdate 
}: ComponentProps) {
  // Hooks at the top
  const [loading, setLoading] = useState(false)
  
  // Event handlers
  const handleSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      await onUpdate?.(data)
    } catch (error) {
      // Handle error
    } finally {
      setLoading(false)
    }
  }
  
  // Render
  return (
    <Card className={cn("default-styles", className)}>
      {/* Component JSX */}
    </Card>
  )
}
```

### Database Query Pattern
```typescript
async function getWorkspaceData(workspaceId: string, userId: string) {
  // 1. Verify access
  await verifyWorkspaceAccess(workspaceId, userId)
  
  // 2. Query with workspace isolation
  return prisma.model.findMany({
    where: { 
      workspaceId,
      deletedAt: null 
    },
    include: {
      // Include related data
    },
    orderBy: { createdAt: 'desc' }
  })
}
```

### API Route Pattern
```typescript
import { NextRequest } from 'next/server'
import { z } from 'zod'

const RequestSchema = z.object({
  name: z.string().min(1),
  workspaceId: z.string().cuid()
})

export async function POST(request: NextRequest) {
  try {
    // 1. Parse and validate
    const body = await request.json()
    const data = RequestSchema.parse(body)
    
    // 2. Get user session
    const session = await getServerSession()
    if (!session?.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // 3. Verify workspace access
    await verifyWorkspaceAccess(data.workspaceId, session.user.id)
    
    // 4. Perform operation
    const result = await createResource(data)
    
    // 5. Return success response
    return Response.json({ success: true, data: result })
    
  } catch (error) {
    console.error('API Error:', error)
    return Response.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}
```

## 🎯 File Naming Conventions

### Components
- `workspace-card.tsx` - Component files
- `use-workspaces.ts` - Custom hooks
- `workspace-utils.ts` - Utility functions
- `workspace-types.ts` - Type definitions

### Pages (App Router)
- `page.tsx` - Page component
- `layout.tsx` - Layout component
- `loading.tsx` - Loading UI
- `error.tsx` - Error UI
- `not-found.tsx` - 404 UI

### API Routes
- `route.ts` - API route handler
- `GET`, `POST`, `PUT`, `DELETE` - HTTP methods

## 🔍 Code Review Checklist

### Before Submitting PR
- [ ] All TypeScript errors resolved
- [ ] ESLint warnings addressed
- [ ] Tests written and passing
- [ ] Workspace isolation verified
- [ ] Error handling implemented
- [ ] Loading states added
- [ ] Accessibility considered
- [ ] Performance optimized
- [ ] Documentation updated

### Reviewer Checklist
- [ ] Code follows established patterns
- [ ] Multi-tenancy properly implemented
- [ ] Security considerations addressed
- [ ] UI/UX matches design system
- [ ] Database queries optimized
- [ ] Error handling comprehensive
- [ ] Tests cover edge cases

## 🚨 Red Flags to Watch For

### Code Smells
- `any` types in TypeScript
- Missing workspace isolation
- Hardcoded values
- Missing error handling
- No loading states
- Accessibility issues
- Performance bottlenecks
- Security vulnerabilities

### Database Issues
- Missing indexes on frequently queried fields
- N+1 query problems
- Missing transactions for multi-step operations
- Hard deletes instead of soft deletes
- Missing workspace filters

### UI/UX Issues
- Modified shadcn/ui components
- Non-responsive design
- Missing accessibility attributes
- Poor error messages
- No empty states
- Inconsistent styling

## 📚 Key Resources

### Documentation
- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [shadcn/ui Docs](https://ui.shadcn.com)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

### Internal Docs
- `docs/rules/` - All development rules
- `docs/guides/` - Step-by-step guides
- `docs/api/` - API documentation
- `README.md` - Project overview

### Tools
- Prisma Studio - Database browser
- VS Code Extensions - See `.vscode/extensions.json`
- ESLint - Code linting
- TypeScript - Type checking

## 🆘 Getting Help

### When Stuck
1. Check existing code for similar patterns
2. Review relevant rules in `docs/rules/`
3. Search codebase for examples
4. Ask team for guidance
5. Create issue for clarification

### Common Questions
- **"How do I add a new model?"** - See `docs/rules/DATABASE_RULES.md`
- **"How do I create a new component?"** - See `docs/rules/UI_COMPONENT_RULES.md`
- **"How do I handle authentication?"** - See `docs/rules/SECURITY_RULES.md`
- **"How do I optimize performance?"** - See `docs/rules/PERFORMANCE_RULES.md`

---

**Remember**: These patterns exist to maintain consistency and quality. When in doubt, follow existing patterns and ask for guidance.
