import { auth } from "@/lib/auth";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const session = await auth();
  const { pathname } = request.nextUrl;

  // Public routes that don't need authentication
  const publicRoutes = ["/", "/auth/signin", "/auth/signup"];
  const isPublicRoute = publicRoutes.includes(pathname);

  // If not authenticated and trying to access protected route
  if (!session && !isPublicRoute) {
    return NextResponse.redirect(new URL("/auth/signin", request.url));
  }

  // If authenticated and trying to access auth pages, redirect to dashboard
  if (session && (pathname === "/auth/signin" || pathname === "/auth/signup")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Handle dashboard redirect logic
  if (session && pathname === "/dashboard") {
    try {
      // Get user's workspaces (minimal data for redirect)
      const response = await fetch(new URL("/api/workspaces", request.url), {
        headers: {
          Cookie: request.headers.get("cookie") || "",
        },
      });

      if (response.ok) {
        const { data: workspaces } = await response.json();

        if (workspaces && workspaces.length > 0) {
          // Get last workspace from cookie or use first workspace
          const lastWorkspace = request.cookies.get(
            "affiflow_last_workspace"
          )?.value;
          const targetWorkspace = lastWorkspace
            ? workspaces.find((w: any) => w.slug === lastWorkspace) ||
              workspaces[0]
            : workspaces[0];

          // Redirect to workspace dashboard
          return NextResponse.redirect(
            new URL(`/${targetWorkspace.slug}/dashboard`, request.url)
          );
        }
        // If no workspaces, stay on dashboard for onboarding
      }
    } catch (error) {
      console.error("Middleware error:", error);
      // If error, continue to dashboard
    }
  }

  // Admin role check
  if (session && pathname.startsWith("/admin")) {
    if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
