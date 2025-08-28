---
type: "agent_requested"
description: "Unit, integration, and E2E testing guidelines"
---

# Testing Standards & Guidelines

## 🎯 Testing Philosophy

### Test Pyramid Approach

1. **Unit Tests (70%)** - Fast, isolated, focused
2. **Integration Tests (20%)** - API routes, database operations
3. **E2E Tests (10%)** - Critical user journeys

### Core Principles

- **Test behavior, not implementation**
- **Write tests that provide confidence**
- **Keep tests simple and readable**
- **Test edge cases and error scenarios**
- **Maintain workspace isolation in all tests**

## 🧪 Unit Testing Standards

### Component Testing with React Testing Library

```typescript
// ✅ Good - Component unit test
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { CreateWorkspaceForm } from "@/components/workspace/create-workspace-form";

// Mock dependencies
jest.mock("sonner");
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

describe("CreateWorkspaceForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should create workspace with valid data", async () => {
    const mockCreateWorkspace = jest.fn().mockResolvedValue({
      id: "1",
      name: "Test Workspace",
      slug: "test-workspace",
    });

    render(
      <CreateWorkspaceForm
        createWorkspace={mockCreateWorkspace}
        onSuccess={jest.fn()}
      />
    );

    // Fill form
    fireEvent.change(screen.getByLabelText(/workspace name/i), {
      target: { value: "Test Workspace" },
    });

    // Submit form
    fireEvent.click(screen.getByRole("button", { name: /create workspace/i }));

    // Verify API call
    await waitFor(() => {
      expect(mockCreateWorkspace).toHaveBeenCalledWith({
        name: "Test Workspace",
        description: "Test description",
        slug: "test-workspace",
      });
    });

    // Verify success feedback
    expect(toast.success).toHaveBeenCalledWith(
      "Workspace created successfully!",
      expect.any(Object)
    );
  });
});
```

### Hook Testing

```typescript
// ✅ Good - Custom hook test
import { renderHook, waitFor } from "@testing-library/react";
import { useWorkspaces } from "@/hooks/use-workspaces";

// Mock fetch
global.fetch = jest.fn();

describe("useWorkspaces", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should fetch workspaces successfully", async () => {
    const mockWorkspaces = [
      { id: "1", name: "Workspace 1", slug: "workspace-1" },
      { id: "2", name: "Workspace 2", slug: "workspace-2" },
    ];

    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          data: mockWorkspaces,
        }),
    });

    const { result } = renderHook(() => useWorkspaces());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.workspaces).toEqual(mockWorkspaces);
    expect(result.current.error).toBeNull();
  });
});
```

## 🔗 Integration Testing

### API Route Testing

```typescript
// ✅ Good - API route integration test
import { createMocks } from "node-mocks-http";
import { GET, POST } from "@/app/api/workspaces/route";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// Mock auth
jest.mock("@/lib/auth");
const mockAuth = auth as jest.MockedFunction<typeof auth>;

describe("/api/workspaces", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET", () => {
    it("should return user workspaces", async () => {
      const mockSession = {
        user: { id: "user1", email: "test@example.com" },
      };

      const mockWorkspaces = [
        {
          id: "ws1",
          name: "Test Workspace",
          slug: "test-workspace",
          users: [{ userId: "user1", role: "OWNER" }],
        },
      ];

      mockAuth.mockResolvedValue(mockSession);
      (prisma.workspace.findMany as jest.Mock).mockResolvedValue(
        mockWorkspaces
      );

      const { req } = createMocks({ method: "GET" });
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockWorkspaces);
    });

    it("should return 401 for unauthenticated users", async () => {
      mockAuth.mockResolvedValue(null);

      const { req } = createMocks({ method: "GET" });
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });
  });
});
```

### Database Testing

```typescript
// ✅ Good - Database integration test
import { prisma } from "@/lib/prisma";
import {
  createTestUser,
  createTestWorkspace,
  cleanupTestData,
} from "@/lib/test-utils";

describe("Workspace Database Operations", () => {
  let testUser: any;

  beforeEach(async () => {
    testUser = await createTestUser();
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  it("should create workspace with user association", async () => {
    const workspaceData = {
      name: "Test Workspace",
      slug: "test-workspace",
      description: "Test description",
    };

    const workspace = await prisma.workspace.create({
      data: {
        ...workspaceData,
        users: {
          create: {
            userId: testUser.id,
            role: "OWNER",
          },
        },
      },
      include: {
        users: {
          include: { user: true },
        },
      },
    });

    expect(workspace.name).toBe(workspaceData.name);
    expect(workspace.users).toHaveLength(1);
    expect(workspace.users[0].userId).toBe(testUser.id);
    expect(workspace.users[0].role).toBe("OWNER");
  });

  it("should enforce workspace isolation", async () => {
    const workspace1 = await createTestWorkspace(testUser.id);
    const workspace2 = await createTestWorkspace(testUser.id);

    // Create posts in different workspaces
    const post1 = await prisma.post.create({
      data: {
        title: "Post 1",
        workspaceId: workspace1.id,
      },
    });

    const post2 = await prisma.post.create({
      data: {
        title: "Post 2",
        workspaceId: workspace2.id,
      },
    });

    // Query posts for workspace1 only
    const workspace1Posts = await prisma.post.findMany({
      where: { workspaceId: workspace1.id },
    });

    expect(workspace1Posts).toHaveLength(1);
    expect(workspace1Posts[0].id).toBe(post1.id);
  });
});
```

## 🎭 E2E Testing with Playwright

### Critical User Journeys

```typescript
// ✅ Good - E2E test for workspace creation flow
import { test, expect } from "@playwright/test";

test.describe("Workspace Creation Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Login user
    await page.goto("/auth/signin");
    await page.fill('[name="email"]', "test@example.com");
    await page.fill('[name="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/dashboard");
  });

  test("should create workspace and redirect to workspace dashboard", async ({
    page,
  }) => {
    // Should be on onboarding dashboard
    await expect(page.locator("h1")).toContainText("Welcome to AffiFlow");

    // Fill workspace form
    await page.fill('[name="name"]', "My Test Workspace");
    await page.fill('[name="description"]', "This is a test workspace");

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to workspace dashboard
    await page.waitForURL("/my-test-workspace/dashboard");

    // Verify workspace is created
    await expect(page.locator("h1")).toContainText("My Test Workspace");

    // Verify success toast
    await expect(page.locator("[data-sonner-toast]")).toContainText(
      "Workspace created successfully"
    );
  });

  test("should show validation errors for invalid input", async ({ page }) => {
    // Try to submit empty form
    await page.click('button[type="submit"]');

    // Should show validation errors
    await expect(page.locator('[role="alert"]')).toContainText(
      "Name is required"
    );
  });
});
```

## 🔧 Test Utilities

### Test Setup Helpers

```typescript
// lib/test-utils.ts
import { prisma } from "@/lib/prisma";

export async function createTestUser(overrides = {}) {
  return prisma.user.create({
    data: {
      email: `test-${Date.now()}@example.com`,
      name: "Test User",
      ...overrides,
    },
  });
}

export async function createTestWorkspace(userId: string, overrides = {}) {
  return prisma.workspace.create({
    data: {
      name: `Test Workspace ${Date.now()}`,
      slug: `test-workspace-${Date.now()}`,
      users: {
        create: {
          userId,
          role: "OWNER",
        },
      },
      ...overrides,
    },
  });
}

export async function cleanupTestData() {
  // Clean up in reverse dependency order
  await prisma.postProduct.deleteMany();
  await prisma.post.deleteMany();
  await prisma.userWorkspace.deleteMany();
  await prisma.workspace.deleteMany();
  await prisma.user.deleteMany({
    where: {
      email: { contains: "test-" },
    },
  });
}
```

## 📋 Testing Checklist

For every feature:

- [ ] **Unit tests** for components and hooks
- [ ] **API route tests** for all endpoints
- [ ] **Database tests** for data operations
- [ ] **Error scenario tests** for failure cases
- [ ] **Workspace isolation tests** for multi-tenancy
- [ ] **E2E tests** for critical user flows
- [ ] **Accessibility tests** for screen readers
- [ ] **Performance tests** for slow operations

## 🚫 Testing Anti-Patterns

### Don't Do This

```typescript
// ❌ Bad - Testing implementation details
expect(component.state.isLoading).toBe(true);

// ❌ Bad - Brittle selectors
await page.click(".css-1234567");

// ❌ Bad - No cleanup
test("should create user", async () => {
  await createUser(); // Never cleaned up!
});

// ❌ Bad - Testing multiple things
test("should create workspace and add posts and manage users", () => {
  // Too much in one test!
});
```

### Do This Instead

```typescript
// ✅ Good - Test user-visible behavior
expect(screen.getByText("Loading...")).toBeInTheDocument();

// ✅ Good - Semantic selectors
await page.click('button[name="create-workspace"]');

// ✅ Good - Proper cleanup
afterEach(async () => {
  await cleanupTestData();
});

// ✅ Good - Single responsibility
test("should create workspace", () => {
  // Test only workspace creation
});
```

});

it("should validate required fields", async () => {
render(<CreateWorkspaceForm createWorkspace={jest.fn()} />);

    // Try to submit without filling required fields
    fireEvent.click(screen.getByRole("button", { name: /create workspace/i }));

    // Check for validation errors
    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    });

});
});

````

### Hook Testing

```typescript
// ✅ Good - Custom hook test
import { renderHook, waitFor } from "@testing-library/react";
import { useWorkspaces } from "@/hooks/use-workspaces";

// Mock fetch
global.fetch = jest.fn();

describe("useWorkspaces", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should fetch workspaces successfully", async () => {
    const mockWorkspaces = [
      { id: "1", name: "Workspace 1", slug: "workspace-1" },
      { id: "2", name: "Workspace 2", slug: "workspace-2" },
    ];

    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          data: mockWorkspaces,
        }),
    });

    const { result } = renderHook(() => useWorkspaces());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.workspaces).toEqual(mockWorkspaces);
    expect(result.current.error).toBeNull();
  });

  it("should handle API errors", async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: () =>
        Promise.resolve({
          success: false,
          error: "Unauthorized",
        }),
    });

    const { result } = renderHook(() => useWorkspaces());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.workspaces).toEqual([]);
    expect(result.current.error).toBe("Unauthorized");
  });
});
````

## 🔗 Integration Testing

### API Route Testing

```typescript
// ✅ Good - API route integration test
import { createMocks } from "node-mocks-http";
import { GET, POST } from "@/app/api/workspaces/route";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// Mock auth
jest.mock("@/lib/auth");
const mockAuth = auth as jest.MockedFunction<typeof auth>;

// Mock Prisma
jest.mock("@/lib/prisma", () => ({
  prisma: {
    workspace: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}));

describe("/api/workspaces", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET", () => {
    it("should return user workspaces", async () => {
      const mockSession = {
        user: { id: "user1", email: "test@example.com" },
      };

      const mockWorkspaces = [
        {
          id: "ws1",
          name: "Test Workspace",
          slug: "test-workspace",
          users: [{ userId: "user1", role: "OWNER" }],
        },
      ];

      mockAuth.mockResolvedValue(mockSession);
      (prisma.workspace.findMany as jest.Mock).mockResolvedValue(
        mockWorkspaces
      );

      const { req } = createMocks({ method: "GET" });
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockWorkspaces);
    });

    it("should return 401 for unauthenticated users", async () => {
      mockAuth.mockResolvedValue(null);

      const { req } = createMocks({ method: "GET" });
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });
  });

  describe("POST", () => {
    it("should create workspace with valid data", async () => {
      const mockSession = {
        user: { id: "user1", email: "test@example.com" },
      };

      const mockWorkspace = {
        id: "ws1",
        name: "New Workspace",
        slug: "new-workspace",
        description: "Test description",
      };

      mockAuth.mockResolvedValue(mockSession);
      (prisma.workspace.create as jest.Mock).mockResolvedValue(mockWorkspace);

      const { req } = createMocks({
        method: "POST",
        body: {
          name: "New Workspace",
          description: "Test description",
        },
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockWorkspace);
    });

    it("should validate required fields", async () => {
      const mockSession = {
        user: { id: "user1", email: "test@example.com" },
      };

      mockAuth.mockResolvedValue(mockSession);

      const { req } = createMocks({
        method: "POST",
        body: {}, // Missing required fields
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation failed");
    });
  });
});
```

### Database Testing

```typescript
// ✅ Good - Database integration test
import { prisma } from "@/lib/prisma";
import {
  createTestUser,
  createTestWorkspace,
  cleanupTestData,
} from "@/lib/test-utils";

describe("Workspace Database Operations", () => {
  let testUser: any;
  let testWorkspace: any;

  beforeEach(async () => {
    testUser = await createTestUser();
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  it("should create workspace with user association", async () => {
    const workspaceData = {
      name: "Test Workspace",
      slug: "test-workspace",
      description: "Test description",
    };

    const workspace = await prisma.workspace.create({
      data: {
        ...workspaceData,
        users: {
          create: {
            userId: testUser.id,
            role: "OWNER",
          },
        },
      },
      include: {
        users: {
          include: { user: true },
        },
      },
    });

    expect(workspace.name).toBe(workspaceData.name);
    expect(workspace.users).toHaveLength(1);
    expect(workspace.users[0].userId).toBe(testUser.id);
    expect(workspace.users[0].role).toBe("OWNER");
  });

  it("should enforce workspace isolation", async () => {
    const workspace1 = await createTestWorkspace(testUser.id);
    const workspace2 = await createTestWorkspace(testUser.id);

    // Create posts in different workspaces
    const post1 = await prisma.post.create({
      data: {
        title: "Post 1",
        workspaceId: workspace1.id,
      },
    });

    const post2 = await prisma.post.create({
      data: {
        title: "Post 2",
        workspaceId: workspace2.id,
      },
    });

    // Query posts for workspace1 only
    const workspace1Posts = await prisma.post.findMany({
      where: { workspaceId: workspace1.id },
    });

    expect(workspace1Posts).toHaveLength(1);
    expect(workspace1Posts[0].id).toBe(post1.id);
  });
});
```

## 🎭 E2E Testing with Playwright

### Critical User Journeys

```typescript
// ✅ Good - E2E test for workspace creation flow
import { test, expect } from "@playwright/test";

test.describe("Workspace Creation Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Login user
    await page.goto("/auth/signin");
    await page.fill('[name="email"]', "test@example.com");
    await page.fill('[name="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/dashboard");
  });

  test("should create workspace and redirect to workspace dashboard", async ({
    page,
  }) => {
    // Should be on onboarding dashboard
    await expect(page.locator("h1")).toContainText("Welcome to AffiFlow");

    // Fill workspace form
    await page.fill('[name="name"]', "My Test Workspace");
    await page.fill('[name="description"]', "This is a test workspace");

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to workspace dashboard
    await page.waitForURL("/my-test-workspace/dashboard");

    // Verify workspace is created
    await expect(page.locator("h1")).toContainText("My Test Workspace");

    // Verify success toast
    await expect(page.locator("[data-sonner-toast]")).toContainText(
      "Workspace created successfully"
    );
  });

  test("should show validation errors for invalid input", async ({ page }) => {
    // Try to submit empty form
    await page.click('button[type="submit"]');

    // Should show validation errors
    await expect(page.locator('[role="alert"]')).toContainText(
      "Name is required"
    );
  });
});
```

## 🔧 Test Utilities

### Test Setup Helpers

```typescript
// lib/test-utils.ts
import { prisma } from "@/lib/prisma";

export async function createTestUser(overrides = {}) {
  return prisma.user.create({
    data: {
      email: `test-${Date.now()}@example.com`,
      name: "Test User",
      ...overrides,
    },
  });
}

export async function createTestWorkspace(userId: string, overrides = {}) {
  return prisma.workspace.create({
    data: {
      name: `Test Workspace ${Date.now()}`,
      slug: `test-workspace-${Date.now()}`,
      users: {
        create: {
          userId,
          role: "OWNER",
        },
      },
      ...overrides,
    },
  });
}

export async function cleanupTestData() {
  // Clean up in reverse dependency order
  await prisma.postProduct.deleteMany();
  await prisma.post.deleteMany();
  await prisma.userWorkspace.deleteMany();
  await prisma.workspace.deleteMany();
  await prisma.user.deleteMany({
    where: {
      email: { contains: "test-" },
    },
  });
}
```

### Mock Providers

```typescript
// components/test-providers.tsx
import { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";

interface TestProvidersProps {
  children: ReactNode;
  session?: any;
}

export function TestProviders({ children, session }: TestProvidersProps) {
  return <SessionProvider session={session}>{children}</SessionProvider>;
}

// Usage in tests
render(
  <TestProviders session={mockSession}>
    <ComponentToTest />
  </TestProviders>
);
```

## 📋 Testing Checklist

For every feature:

- [ ] **Unit tests** for components and hooks
- [ ] **API route tests** for all endpoints
- [ ] **Database tests** for data operations
- [ ] **Error scenario tests** for failure cases
- [ ] **Workspace isolation tests** for multi-tenancy
- [ ] **E2E tests** for critical user flows
- [ ] **Accessibility tests** for screen readers
- [ ] **Performance tests** for slow operations

## 🚫 Testing Anti-Patterns

### Don't Do This

```typescript
// ❌ Bad - Testing implementation details
expect(component.state.isLoading).toBe(true);

// ❌ Bad - Brittle selectors
await page.click(".css-1234567");

// ❌ Bad - No cleanup
test("should create user", async () => {
  await createUser(); // Never cleaned up!
});

// ❌ Bad - Testing multiple things
test("should create workspace and add posts and manage users", () => {
  // Too much in one test!
});
```

### Do This Instead

```typescript
// ✅ Good - Test user-visible behavior
expect(screen.getByText("Loading...")).toBeInTheDocument();

// ✅ Good - Semantic selectors
await page.click('button[name="create-workspace"]');

// ✅ Good - Proper cleanup
afterEach(async () => {
  await cleanupTestData();
});

// ✅ Good - Single responsibility
test("should create workspace", () => {
  // Test only workspace creation
});
```
