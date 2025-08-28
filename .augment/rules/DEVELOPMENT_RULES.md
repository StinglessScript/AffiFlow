---
type: "always_apply"
description: "Example description"
---

# AffiFlow Development Rules & Standards

## 🎯 Project Overview

AffiFlow is a SaaS platform for content creators to build channels with product integration and affiliate marketing. This document outlines the development standards and rules to maintain code quality and consistency.

## 📋 Core Principles

### 1. **Multi-Tenant Architecture**

- Every feature MUST support multiple workspaces per user
- Always include `workspaceId` in data operations where applicable
- Use workspace-scoped queries to prevent data leakage
- Test multi-tenancy in all features

### 2. **Type Safety First**

- Use TypeScript for ALL code
- Define proper interfaces in `src/types/index.ts`
- No `any` types unless absolutely necessary
- Use Prisma-generated types when possible

### 3. **Database Standards**

- Use Prisma ORM for all database operations
- Always use transactions for multi-table operations
- Include proper indexes for performance
- Use soft deletes where appropriate (add `deletedAt` field)

## 🏗️ Architecture Rules

### File Structure

```
src/
├── app/                    # Next.js App Router ONLY
│   ├── (auth)/            # Auth pages (signin, signup)
│   ├── (dashboard)/       # Protected dashboard pages
│   ├── (public)/          # Public workspace pages
│   └── api/               # API routes
├── components/            # Reusable React components
│   ├── ui/                # shadcn/ui components (DO NOT MODIFY)
│   ├── layout/            # Layout components
│   ├── workspace/         # Workspace-specific components
│   └── content/           # Content management components
├── lib/                   # Utility functions and configurations
├── hooks/                 # Custom React hooks
├── types/                 # TypeScript type definitions
└── generated/             # Generated files (DO NOT EDIT)
```

### Component Rules

1. **Use shadcn/ui components** - Don't create custom UI components if shadcn/ui has them
2. **Component naming**: PascalCase for components, kebab-case for files
3. **Props interface**: Always define props interface for components
4. **Default exports**: Use default exports for page components, named exports for utilities

### API Routes Rules

1. **RESTful design**: Use proper HTTP methods (GET, POST, PUT, DELETE)
2. **Error handling**: Always return proper HTTP status codes
3. **Validation**: Use Zod for request validation
4. **Response format**: Consistent API response structure:

```typescript
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
```

## 🎨 UI/UX Standards

### Design System

- **Primary Color**: Indigo (600) - `bg-indigo-600`, `text-indigo-600`
- **Typography**: Use Tailwind typography classes
- **Spacing**: Use Tailwind spacing scale (4, 6, 8, 12, 16, 24, etc.)
- **Responsive**: Mobile-first design with `sm:`, `md:`, `lg:` breakpoints

### Component Guidelines

1. **Accessibility**: Always include proper ARIA labels and keyboard navigation
2. **Loading states**: Show loading indicators for async operations
3. **Error states**: Display user-friendly error messages
4. **Empty states**: Provide helpful empty state messages with actions

## 🔐 Security Rules

### Authentication

- Use NextAuth.js v5 for all authentication
- Protect all dashboard routes with middleware
- Validate user permissions for workspace access
- Never expose sensitive data in client-side code

### Data Validation

- Validate ALL user inputs with Zod schemas
- Sanitize data before database operations
- Use parameterized queries (Prisma handles this)
- Implement rate limiting for API endpoints

## 📊 Database Rules

### Schema Design

1. **Naming**: Use snake_case for database fields, camelCase in TypeScript
2. **Relations**: Always define proper foreign key relationships
3. **Indexes**: Add indexes for frequently queried fields
4. **Migrations**: Never edit existing migrations, create new ones

### Data Operations

1. **Workspace Isolation**: Always filter by workspaceId in queries
2. **Soft Deletes**: Use `deletedAt` field instead of hard deletes
3. **Audit Trail**: Include `createdAt` and `updatedAt` for all entities
4. **Transactions**: Use database transactions for multi-step operations

## 🧪 Testing Standards

### Unit Tests

- Test all utility functions in `src/lib/`
- Test custom hooks in `src/hooks/`
- Use Jest and React Testing Library
- Aim for 80%+ code coverage

### Integration Tests

- Test API routes with proper request/response validation
- Test database operations with test database
- Test authentication flows
- Test multi-tenant data isolation

## 🚀 Performance Rules

### Frontend Performance

1. **Code Splitting**: Use dynamic imports for large components
2. **Image Optimization**: Use Next.js Image component
3. **Bundle Size**: Monitor bundle size with `@next/bundle-analyzer`
4. **Caching**: Implement proper caching strategies

### Backend Performance

1. **Database Queries**: Optimize N+1 queries with Prisma includes
2. **API Response Time**: Keep API responses under 200ms
3. **Pagination**: Implement cursor-based pagination for large datasets
4. **Caching**: Use Redis for frequently accessed data

## 🔄 Git Workflow

### Commit Messages

Use conventional commits format:

```
feat: add workspace creation functionality
fix: resolve video embed parsing issue
docs: update API documentation
refactor: optimize database queries
test: add unit tests for video utils
```

### Branch Naming

- `feature/workspace-management`
- `fix/video-embed-bug`
- `refactor/database-optimization`

### Pull Request Rules

1. **Code Review**: All PRs require at least one review
2. **Tests**: All PRs must include tests
3. **Documentation**: Update docs if adding new features
4. **No Direct Push**: Never push directly to main branch

## 🐛 Error Handling

### Frontend Errors

1. **Error Boundaries**: Use React Error Boundaries for component errors
2. **User Feedback**: Show toast notifications for user actions
3. **Fallback UI**: Provide fallback UI for failed components
4. **Logging**: Log errors to monitoring service

### Backend Errors

1. **Structured Logging**: Use structured logging with context
2. **Error Codes**: Define consistent error codes
3. **User-Friendly Messages**: Return user-friendly error messages
4. **Monitoring**: Set up error monitoring and alerting

## 📝 Documentation Rules

### Code Documentation

1. **JSDoc**: Document all public functions and complex logic
2. **README**: Keep README.md updated with setup instructions
3. **API Docs**: Document all API endpoints
4. **Type Definitions**: Document complex types and interfaces

### Comments

- Explain WHY, not WHAT
- Use TODO comments for future improvements
- Remove commented-out code before committing
- Add comments for complex business logic

## 🔧 Development Environment

### Required Tools

- Node.js 18+
- PostgreSQL 14+
- VS Code with recommended extensions
- Prisma Studio for database management

### Environment Variables

- Never commit `.env` files
- Use `.env.example` for documentation
- Validate required env vars at startup
- Use different env files for different environments

## ⚠️ Common Pitfalls to Avoid

1. **Don't modify shadcn/ui components directly** - Extend them instead
2. **Don't forget workspace isolation** - Always filter by workspaceId
3. **Don't use client-side state for server data** - Use React Query/SWR
4. **Don't hardcode URLs** - Use environment variables
5. **Don't skip error handling** - Always handle errors gracefully
6. **Don't ignore TypeScript errors** - Fix all TS errors before committing

## 🎯 Quality Gates

Before any feature is considered complete:

- [ ] All TypeScript errors resolved
- [ ] All tests passing
- [ ] Code reviewed and approved
- [ ] Documentation updated
- [ ] Performance tested
- [ ] Security reviewed
- [ ] Multi-tenancy tested

---

**Remember**: These rules exist to maintain code quality and team productivity. When in doubt, ask for clarification rather than making assumptions.
