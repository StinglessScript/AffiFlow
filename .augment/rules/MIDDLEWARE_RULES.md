---
type: "agent_requested"
description: "Middleware development and redirect logic"
---

# Middleware Development Rules

## 🎯 Core Principles

### 1. Always Handle API Response Structure Correctly

Middleware MUST use the standard API response format when making internal API calls:

```typescript
// ✅ Good - Correct API consumption in middleware
const response = await fetch(new URL("/api/workspaces", request.url), {
  headers: { Cookie: request.headers.get("cookie") || "" },
});

if (response.ok) {
  const { success, data: workspaces, error } = await response.json();

  if (success && workspaces?.length > 0) {
    // Handle redirect logic
  }
}

// ❌ Bad - Wrong destructuring
const { workspaces } = await response.json(); // Assumes non-standard structure
```

### 2. Robust Error Handling

```typescript
// ✅ Good - Comprehensive error handling
try {
  const response = await fetch(new URL("/api/workspaces", request.url), {
    headers: { Cookie: request.headers.get("cookie") || "" },
  });

  if (!response.ok) {
    console.error(`API Error: ${response.status} ${response.statusText}`);
    return NextResponse.next(); // Continue to original destination
  }

  const result = await response.json();

  if (!result.success) {
    console.error("API returned error:", result.error);
    return NextResponse.next();
  }

  // Process successful response
  const workspaces = result.data;
} catch (error) {
  console.error("Middleware fetch error:", error);
  return NextResponse.next(); // Don't break the request flow
}
```

## 🔄 Redirect Logic Rules

### 1. Clear Redirect Conditions

```typescript
// ✅ Good - Clear, documented redirect logic
export async function middleware(request: NextRequest) {
  const session = await auth();
  const { pathname } = request.nextUrl;

  // 1. Public routes - no auth required
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // 2. Unauthenticated users - redirect to signin
  if (!session) {
    return NextResponse.redirect(new URL("/auth/signin", request.url));
  }

  // 3. Auth pages when logged in - redirect to dashboard
  if (isAuthPage(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // 4. Dashboard redirect logic - redirect to workspace if available
  if (pathname === "/dashboard") {
    return await handleDashboardRedirect(request, session);
  }

  return NextResponse.next();
}
```

### 2. Workspace Selection Logic

```typescript
// ✅ Good - Smart workspace selection
async function selectTargetWorkspace(
  workspaces: Workspace[],
  request: NextRequest
): Promise<Workspace> {
  // 1. Try last workspace from cookie
  const lastWorkspaceSlug = request.cookies.get(
    "affiflow_last_workspace"
  )?.value;
  if (lastWorkspaceSlug) {
    const lastWorkspace = workspaces.find((w) => w.slug === lastWorkspaceSlug);
    if (lastWorkspace) {
      return lastWorkspace;
    }
  }

  // 2. Try most recently accessed workspace
  const recentWorkspace = workspaces.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )[0];

  if (recentWorkspace) {
    return recentWorkspace;
  }

  // 3. Fallback to first workspace
  return workspaces[0];
}
```

## 🚫 Common Pitfalls

### Anti-Patterns to Avoid

```typescript
// ❌ Bad - Assuming API response structure
const { workspaces } = await response.json(); // What if structure changes?

// ❌ Bad - No error handling
const response = await fetch("/api/workspaces");
const data = await response.json(); // What if fetch fails?

// ❌ Bad - Blocking middleware on slow APIs
await fetch("/api/slow-endpoint"); // Don't block all requests

// ❌ Bad - Complex business logic in middleware
if (
  user.subscription.plan === "premium" &&
  user.features.includes("advanced")
) {
  // Too complex for middleware!
}

// ❌ Bad - Not handling edge cases
const targetWorkspace = workspaces[0]; // What if workspaces is empty?
```

### Best Practices

```typescript
// ✅ Good - Defensive programming
const result = await response.json();
const workspaces = result?.success ? result.data : [];

if (!Array.isArray(workspaces) || workspaces.length === 0) {
  return NextResponse.next(); // Stay on current page
}

// ✅ Good - Simple, fast middleware
// Keep middleware logic simple and fast
// Move complex logic to page components or API routes

// ✅ Good - Graceful degradation
try {
  // Attempt redirect logic
} catch (error) {
  console.error("Middleware error:", error);
  // Always allow request to continue
  return NextResponse.next();
}
```

## 📋 Middleware Checklist

Before deploying middleware changes:

- [ ] Handles all API response structures correctly
- [ ] Includes comprehensive error handling
- [ ] Doesn't block requests on API failures
- [ ] Tests cover success and error scenarios
- [ ] Performance impact is minimal
- [ ] Logging is appropriate (not too verbose)
- [ ] Edge cases are handled (empty arrays, null values)
- [ ] Fallback behavior is defined for all code paths

````

## 🔄 Redirect Logic Rules

### 1. Clear Redirect Conditions

```typescript
// ✅ Good - Clear, documented redirect logic
export async function middleware(request: NextRequest) {
  const session = await auth();
  const { pathname } = request.nextUrl;

  // 1. Public routes - no auth required
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // 2. Unauthenticated users - redirect to signin
  if (!session) {
    return NextResponse.redirect(new URL("/auth/signin", request.url));
  }

  // 3. Auth pages when logged in - redirect to dashboard
  if (isAuthPage(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // 4. Dashboard redirect logic - redirect to workspace if available
  if (pathname === "/dashboard") {
    return await handleDashboardRedirect(request, session);
  }

  // 5. Admin access control
  if (pathname.startsWith("/admin")) {
    return handleAdminAccess(request, session);
  }

  return NextResponse.next();
}
````

### 2. Workspace Selection Logic

```typescript
// ✅ Good - Smart workspace selection
async function selectTargetWorkspace(
  workspaces: Workspace[],
  request: NextRequest
): Promise<Workspace> {
  // 1. Try last workspace from cookie
  const lastWorkspaceSlug = request.cookies.get(
    "affiflow_last_workspace"
  )?.value;
  if (lastWorkspaceSlug) {
    const lastWorkspace = workspaces.find((w) => w.slug === lastWorkspaceSlug);
    if (lastWorkspace) {
      return lastWorkspace;
    }
  }

  // 2. Try most recently accessed workspace
  const recentWorkspace = workspaces.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )[0];

  if (recentWorkspace) {
    return recentWorkspace;
  }

  // 3. Fallback to first workspace
  return workspaces[0];
}
```

## 🧪 Testing Middleware

### 1. Unit Tests for Middleware Logic

```typescript
// ✅ Good - Test middleware redirect logic
describe("Middleware", () => {
  it("should redirect to workspace when user has workspaces", async () => {
    const mockRequest = new NextRequest("http://localhost:3000/dashboard");
    const mockSession = { user: { id: "user1" } };

    // Mock API response
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          data: [{ id: "1", slug: "test-workspace" }],
        }),
    });

    const response = await middleware(mockRequest);

    expect(response.status).toBe(307); // Redirect
    expect(response.headers.get("location")).toBe("/test-workspace/dashboard");
  });

  it("should stay on dashboard when no workspaces", async () => {
    // Mock empty workspaces response
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          data: [],
        }),
    });

    const response = await middleware(mockRequest);

    expect(response.status).toBe(200); // Continue
  });
});
```

### 2. Integration Tests

```typescript
// ✅ Good - Test actual middleware behavior
describe("Middleware Integration", () => {
  it("should handle API errors gracefully", async () => {
    // Mock API failure
    global.fetch = jest.fn().mockRejectedValue(new Error("API Error"));

    const response = await middleware(mockRequest);

    // Should continue to dashboard instead of crashing
    expect(response.status).toBe(200);
  });
});
```

## 🚫 Common Pitfalls

### Anti-Patterns to Avoid

```typescript
// ❌ Bad - Assuming API response structure
const { workspaces } = await response.json(); // What if structure changes?

// ❌ Bad - No error handling
const response = await fetch("/api/workspaces");
const data = await response.json(); // What if fetch fails?

// ❌ Bad - Blocking middleware on slow APIs
await fetch("/api/slow-endpoint"); // Don't block all requests

// ❌ Bad - Complex business logic in middleware
if (
  user.subscription.plan === "premium" &&
  user.features.includes("advanced")
) {
  // Too complex for middleware!
}

// ❌ Bad - Not handling edge cases
const targetWorkspace = workspaces[0]; // What if workspaces is empty?
```

### Best Practices

```typescript
// ✅ Good - Defensive programming
const result = await response.json();
const workspaces = result?.success ? result.data : [];

if (!Array.isArray(workspaces) || workspaces.length === 0) {
  return NextResponse.next(); // Stay on current page
}

// ✅ Good - Simple, fast middleware
// Keep middleware logic simple and fast
// Move complex logic to page components or API routes

// ✅ Good - Graceful degradation
try {
  // Attempt redirect logic
} catch (error) {
  console.error("Middleware error:", error);
  // Always allow request to continue
  return NextResponse.next();
}
```

## 📋 Middleware Checklist

Before deploying middleware changes:

- [ ] Handles all API response structures correctly
- [ ] Includes comprehensive error handling
- [ ] Doesn't block requests on API failures
- [ ] Tests cover success and error scenarios
- [ ] Performance impact is minimal
- [ ] Logging is appropriate (not too verbose)
- [ ] Edge cases are handled (empty arrays, null values)
- [ ] Fallback behavior is defined for all code paths

## 🔧 Debugging Middleware

### Logging Best Practices

```typescript
// ✅ Good - Structured logging
console.log("Middleware: Processing request", {
  pathname: request.nextUrl.pathname,
  userId: session?.user?.id,
  timestamp: new Date().toISOString(),
});

// ❌ Bad - Verbose logging
console.log("User is authenticated");
console.log("Fetching workspaces...");
console.log("Got workspaces:", workspaces);
```

### Development vs Production

```typescript
// ✅ Good - Environment-aware logging
if (process.env.NODE_ENV === "development") {
  console.log("Middleware debug:", { pathname, workspaces });
}

// Production: Only log errors
if (error) {
  console.error("Middleware error:", error);
}
```
