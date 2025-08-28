---
type: "always_apply"
description: "Example description"
---

# UI Component Rules & Standards

## 🎨 Design System Principles

### 1. Use shadcn/ui as Foundation

- **DO NOT** modify shadcn/ui components directly
- **DO** extend them with composition
- **DO** use the provided variants and styling props

```typescript
// ✅ Good - Extending shadcn/ui component
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface WorkspaceButtonProps {
  workspace: Workspace;
  variant?: "default" | "outline" | "ghost";
  className?: string;
}

export function WorkspaceButton({
  workspace,
  variant = "default",
  className,
}: WorkspaceButtonProps) {
  return (
    <Button
      variant={variant}
      className={cn("flex items-center gap-2", className)}
    >
      <WorkspaceIcon workspace={workspace} />
      {workspace.name}
    </Button>
  );
}

// ❌ Bad - Modifying shadcn/ui component directly
// Don't edit files in src/components/ui/
```

### 2. Component Composition Pattern

```typescript
// ✅ Good - Composable components
export function WorkspaceCard({ workspace }: { workspace: Workspace }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{workspace.name}</CardTitle>
        <CardDescription>{workspace.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <WorkspaceStats workspace={workspace} />
      </CardContent>
      <CardFooter>
        <WorkspaceActions workspace={workspace} />
      </CardFooter>
    </Card>
  );
}
```

## 🏗️ Component Architecture

### Component Types & Organization

#### 1. UI Components (`src/components/ui/`)

- **shadcn/ui components only**
- **DO NOT** add custom components here
- **DO NOT** modify existing components

#### 2. Layout Components (`src/components/layout/`)

```typescript
// header.tsx
export function Header({ user }: { user: User }) {
  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-3">
        <nav className="flex items-center justify-between">
          <Logo />
          <UserMenu user={user} />
        </nav>
      </div>
    </header>
  );
}

// sidebar.tsx
export function Sidebar({ workspaces }: { workspaces: Workspace[] }) {
  return (
    <aside className="w-64 border-r bg-gray-50">
      <WorkspaceSelector workspaces={workspaces} />
      <Navigation />
    </aside>
  );
}
```

#### 3. Feature Components (`src/components/workspace/`, `src/components/content/`)

```typescript
// workspace/workspace-settings.tsx
interface WorkspaceSettingsProps {
  workspace: Workspace;
  onUpdate: (data: UpdateWorkspaceData) => Promise<void>;
}

export function WorkspaceSettings({
  workspace,
  onUpdate,
}: WorkspaceSettingsProps) {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workspace Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <WorkspaceForm
          workspace={workspace}
          onSubmit={onUpdate}
          isLoading={isLoading}
        />
      </CardContent>
    </Card>
  );
}
```

### Component Props Standards

#### Props Interface

```typescript
// ✅ Good - Explicit props interface
interface VideoPlayerProps {
  videoUrl: string;
  autoplay?: boolean;
  controls?: boolean;
  onTimeUpdate?: (time: number) => void;
  onProductClick?: (productId: string, timestamp: number) => void;
  className?: string;
  children?: React.ReactNode;
}

// ✅ Good - Extend HTML props when needed
interface CustomButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}
```

#### Default Props & Destructuring

```typescript
// ✅ Good - Default values in destructuring
export function VideoPlayer({
  videoUrl,
  autoplay = false,
  controls = true,
  onTimeUpdate,
  onProductClick,
  className,
  children,
}: VideoPlayerProps) {
  // Component implementation
}
```

## 🎨 Styling Standards

### Tailwind CSS Usage

```typescript
// ✅ Good - Semantic class combinations
<div className="flex items-center justify-between p-4 border-b border-gray-200">
  <h2 className="text-lg font-semibold text-gray-900">Workspace Settings</h2>
  <Button variant="outline" size="sm">Edit</Button>
</div>

// ✅ Good - Responsive design
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {workspaces.map(workspace => (
    <WorkspaceCard key={workspace.id} workspace={workspace} />
  ))}
</div>

// ✅ Good - Conditional classes with cn utility
<Button
  className={cn(
    "w-full",
    isLoading && "opacity-50 cursor-not-allowed",
    variant === "danger" && "bg-red-600 hover:bg-red-700"
  )}
>
  {isLoading ? "Loading..." : "Submit"}
</Button>
```

### Color System

```typescript
// ✅ Good - Use design system colors
const colorClasses = {
  primary: "bg-indigo-600 text-white hover:bg-indigo-700",
  secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200",
  success: "bg-green-600 text-white hover:bg-green-700",
  warning: "bg-yellow-500 text-white hover:bg-yellow-600",
  danger: "bg-red-600 text-white hover:bg-red-700"
}

// ❌ Bad - Hardcoded colors
<div className="bg-blue-500 text-white"> // Use primary instead
```

## 📱 Responsive Design Rules

### Mobile-First Approach

```typescript
// ✅ Good - Mobile-first responsive design
<div className="
  flex flex-col space-y-4
  sm:flex-row sm:space-y-0 sm:space-x-4
  lg:space-x-6
">
  <div className="flex-1">
    <WorkspaceInfo workspace={workspace} />
  </div>
  <div className="w-full sm:w-auto">
    <WorkspaceActions workspace={workspace} />
  </div>
</div>

// ✅ Good - Responsive grid
<div className="
  grid grid-cols-1 gap-4
  sm:grid-cols-2 sm:gap-6
  lg:grid-cols-3
  xl:grid-cols-4
">
  {items.map(item => <ItemCard key={item.id} item={item} />)}
</div>
```

### Breakpoint Usage

- `sm:` - 640px and up (tablets)
- `md:` - 768px and up (small laptops)
- `lg:` - 1024px and up (laptops)
- `xl:` - 1280px and up (desktops)

## 🔄 State Management in Components

### Local State

```typescript
// ✅ Good - Typed local state
export function WorkspaceForm({ workspace, onSubmit }: WorkspaceFormProps) {
  const [formData, setFormData] = useState<UpdateWorkspaceData>({
    name: workspace.name,
    description: workspace.description || "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      await onSubmit(formData);
    } catch (error) {
      setErrors({ submit: "Failed to update workspace" });
    } finally {
      setIsLoading(false);
    }
  };
}
```

### Form Handling

```typescript
// ✅ Good - React Hook Form with Zod validation
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const WorkspaceSchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name too long"),
  description: z.string().max(200, "Description too long").optional(),
});

type WorkspaceFormData = z.infer<typeof WorkspaceSchema>;

export function WorkspaceForm({ workspace, onSubmit }: WorkspaceFormProps) {
  const form = useForm<WorkspaceFormData>({
    resolver: zodResolver(WorkspaceSchema),
    defaultValues: {
      name: workspace.name,
      description: workspace.description || "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Workspace Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
```

## ♿ Accessibility Standards

### ARIA Labels & Roles

```typescript
// ✅ Good - Proper accessibility
<button
  aria-label={`Delete workspace ${workspace.name}`}
  aria-describedby="delete-warning"
  onClick={() => handleDelete(workspace.id)}
>
  <TrashIcon className="w-4 h-4" />
</button>

<div id="delete-warning" className="sr-only">
  This action cannot be undone
</div>

// ✅ Good - Form accessibility
<div>
  <Label htmlFor="workspace-name">Workspace Name</Label>
  <Input
    id="workspace-name"
    aria-describedby="name-help"
    aria-invalid={!!errors.name}
    {...field}
  />
  {errors.name && (
    <div id="name-help" role="alert" className="text-red-600 text-sm">
      {errors.name}
    </div>
  )}
</div>
```

### Keyboard Navigation

```typescript
// ✅ Good - Keyboard support
export function WorkspaceCard({ workspace }: { workspace: Workspace }) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect(workspace.id);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onClick={() => onSelect(workspace.id)}
      className="cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
    >
      {/* Card content */}
    </div>
  );
}
```

## 🔄 Loading & Error States

### Loading States

```typescript
// ✅ Good - Loading state handling
export function WorkspaceList() {
  const { data: workspaces, isLoading, error } = useWorkspaces();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <WorkspaceCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Failed to load workspaces</p>
        <Button onClick={() => refetch()} variant="outline" className="mt-2">
          Try Again
        </Button>
      </div>
    );
  }

  if (!workspaces?.length) {
    return <EmptyWorkspaceState />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {workspaces.map((workspace) => (
        <WorkspaceCard key={workspace.id} workspace={workspace} />
      ))}
    </div>
  );
}
```

### Skeleton Components

```typescript
// ✅ Good - Skeleton loading state
export function WorkspaceCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="h-6 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
        </div>
      </CardContent>
    </Card>
  );
}
```

## 🚫 Common Anti-Patterns

### Don't Do This

```typescript
// ❌ Bad - Modifying shadcn/ui components
// Don't edit src/components/ui/button.tsx

// ❌ Bad - Inline styles
<div style={{ backgroundColor: '#3b82f6', padding: '16px' }}>

// ❌ Bad - Non-semantic HTML
<div onClick={handleClick}>Click me</div> // Use button instead

// ❌ Bad - Missing accessibility
<img src="workspace.jpg" /> // Missing alt text

// ❌ Bad - Hardcoded strings
<Button>Delete</Button> // Should be translatable

// ❌ Bad - Missing error boundaries
function App() {
  return <WorkspaceList /> // What if this crashes?
}
```

### Do This Instead

```typescript
// ✅ Good - Extend shadcn/ui components
export function CustomButton({ children, ...props }: CustomButtonProps) {
  return <Button {...props}>{children}</Button>
}

// ✅ Good - Tailwind classes
<div className="bg-blue-600 p-4">

// ✅ Good - Semantic HTML
<button onClick={handleClick}>Click me</button>

// ✅ Good - Accessibility
<img src="workspace.jpg" alt={`${workspace.name} workspace`} />

// ✅ Good - Internationalization ready
<Button>{t('common.delete')}</Button>

// ✅ Good - Error boundary
<ErrorBoundary fallback={<ErrorFallback />}>
  <WorkspaceList />
</ErrorBoundary>
```
