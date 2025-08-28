---
type: "agent_requested"
description: "Toast notifications, error handling, and user feedback"
---

# User Feedback & Error Handling Rules

## 🎯 Core Principles

### 1. Always Provide User Feedback

Every user action MUST provide appropriate feedback:

- **Success**: Toast notification or visual confirmation
- **Error**: Clear error message with actionable steps
- **Loading**: Loading state with progress indication
- **Empty**: Helpful empty state with next steps

### 2. Use Sonner for Toast Notifications

AffiFlow uses Sonner for consistent toast notifications:

```typescript
import { toast } from "sonner";

// ✅ Good - Success feedback
const handleCreateWorkspace = async (data: CreateWorkspaceData) => {
  try {
    const workspace = await createWorkspace(data);
    toast.success("Workspace created successfully!", {
      description: `${workspace.name} is ready to use`,
      action: {
        label: "View",
        onClick: () => router.push(`/${workspace.slug}/dashboard`),
      },
    });
  } catch (error) {
    toast.error("Failed to create workspace", {
      description: "Please check your input and try again",
      action: {
        label: "Retry",
        onClick: () => handleCreateWorkspace(data),
      },
    });
  }
};
```

## 📱 Toast Notification Standards

### Success Messages

```typescript
toast.success("Workspace created successfully!", {
  description: "You can now start adding content and products",
});

toast.success("Post published!", {
  description: "Your content is now live and visible to visitors",
});
```

### Error Messages

```typescript
toast.error("Failed to save changes", {
  description: "Please check your internet connection and try again",
  action: {
    label: "Retry",
    onClick: () => handleSave(),
  },
});

toast.error("Invalid video URL", {
  description: "Please enter a valid YouTube, TikTok, or Instagram URL",
});
```

### Loading States

```typescript
// ✅ Good - Loading with promise
const createWorkspacePromise = createWorkspace(data);

toast.promise(createWorkspacePromise, {
  loading: "Creating workspace...",
  success: (workspace) => `${workspace.name} created successfully!`,
  error: "Failed to create workspace",
});

// ✅ Good - Manual loading state
const [isLoading, setIsLoading] = useState(false);

const handleSubmit = async () => {
  setIsLoading(true);
  const toastId = toast.loading("Saving changes...");

  try {
    await saveChanges();
    toast.success("Changes saved successfully!", { id: toastId });
  } catch (error) {
    toast.error("Failed to save changes", { id: toastId });
  } finally {
    setIsLoading(false);
  }
};
```

## 📊 Loading State Patterns

### Skeleton Loading

```typescript
// ✅ Good - Skeleton components for loading states
export function WorkspaceCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </CardContent>
    </Card>
  );
}

// Usage
export function WorkspaceList() {
  const { data: workspaces, isLoading } = useWorkspaces();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <WorkspaceCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {workspaces?.map((workspace) => (
        <WorkspaceCard key={workspace.id} workspace={workspace} />
      ))}
    </div>
  );
}
```

### Button Loading States

```typescript
// ✅ Good - Button with loading state
export function CreateWorkspaceButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async () => {
    setIsLoading(true);
    try {
      await createWorkspace(data);
      toast.success("Workspace created!");
    } catch (error) {
      toast.error("Failed to create workspace");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleCreate}
      disabled={isLoading}
      className="flex items-center gap-2"
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Creating...
        </>
      ) : (
        <>
          <Plus className="h-4 w-4" />
          Create Workspace
        </>
      )}
    </Button>
  );
}
```

## 🎭 Empty States

### Helpful Empty States

```typescript
// ✅ Good - Informative empty states
export function EmptyWorkspaceState() {
  return (
    <div className="text-center py-12">
      <Building className="h-16 w-16 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        No workspaces yet
      </h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        Create your first workspace to start sharing content and earning through
        affiliate marketing.
      </p>
      <CreateWorkspaceButton />
    </div>
  );
}

export function EmptyPostsState({ workspaceSlug }: { workspaceSlug: string }) {
  return (
    <div className="text-center py-12">
      <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">No posts yet</h3>
      <p className="text-gray-600 mb-6">
        Start creating content to engage your audience and promote products.
      </p>
      <Button asChild>
        <Link href={`/${workspaceSlug}/posts/new`}>
          <Plus className="h-4 w-4 mr-2" />
          Create First Post
        </Link>
      </Button>
    </div>
  );
}
```

## 🚫 Anti-Patterns to Avoid

### Don't Do This

```typescript
// ❌ Bad - Silent failures
const handleSubmit = async () => {
  try {
    await submitForm();
    // No success feedback!
  } catch (error) {
    // No error feedback!
  }
};

// ❌ Bad - Generic error messages
toast.error("Error occurred");

// ❌ Bad - No loading states
const handleSubmit = async () => {
  await submitForm(); // User doesn't know it's processing
};

// ❌ Bad - No empty states
if (!data?.length) {
  return null; // User sees blank screen
}
```

### Do This Instead

```typescript
// ✅ Good - Complete feedback cycle
const handleSubmit = async () => {
  const toastId = toast.loading("Processing...");

  try {
    const result = await submitForm();
    toast.success("Form submitted successfully!", {
      id: toastId,
      description: "Your changes have been saved",
    });
  } catch (error) {
    toast.error("Failed to submit form", {
      id: toastId,
      description: "Please check your input and try again",
    });
  }
};

// ✅ Good - Helpful empty state
if (!data?.length) {
  return <EmptyDataState onAction={handleCreateNew} />;
}
```

## 📋 User Feedback Checklist

For every user interaction:

- [ ] **Loading state** - Show progress during async operations
- [ ] **Success feedback** - Confirm successful actions
- [ ] **Error handling** - Display helpful error messages
- [ ] **Empty states** - Guide users when no data exists
- [ ] **Validation feedback** - Real-time form validation
- [ ] **Accessibility** - Screen reader friendly messages
- [ ] **Retry mechanisms** - Allow users to retry failed actions
- [ ] **Progress indication** - Show progress for long operations
