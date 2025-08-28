---
type: "agent_requested"
description: "API design, validation, and response formats"
---

# API Standards

## 🎯 Standard Response Format

ALL APIs MUST use: `{ success: boolean, data?: T, error?: string, message?: string }`

```typescript
// ✅ Success
return NextResponse.json({ success: true, data: workspaces });

// ✅ Error
return NextResponse.json(
  { success: false, error: "Not found" },
  { status: 404 }
);

// ❌ Wrong
return NextResponse.json({ workspaces }); // Use 'data' property
```

## 🔄 Client Consumption

```typescript
// ✅ Correct destructuring
const { success, data: workspaces, error } = await response.json();

// ❌ Wrong - assumes non-standard structure
const { workspaces } = await response.json();
```

## 📝 Type Safety

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

function isSuccessResponse<T>(
  response: ApiResponse<T>
): response is { success: true; data: T } {
  return response.success === true;
}
```

## 📋 Checklist

- [ ] Response follows `{ success, data?, error? }` structure
- [ ] Proper HTTP status codes
- [ ] TypeScript interfaces defined
- [ ] Client code uses correct destructuring
- [ ] Tests verify response structure
