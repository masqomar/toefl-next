import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

type Role = "USER" | "ADMIN" | "SUPER_ADMIN";

type RouteConfig = {
  patterns: RegExp[];
  roles?: Role[];
};

const protectedRoutes: RouteConfig = {
  patterns: [
    /^\/dashboard/,
    /^\/profile/,
    /^\/settings/,
  ],
  roles: ["USER", "ADMIN", "SUPER_ADMIN"],
};

const adminRoutes: RouteConfig = {
  patterns: [
    /^\/admin/,
  ],
  roles: ["ADMIN", "SUPER_ADMIN"],
};

const superAdminRoutes: RouteConfig = {
  patterns: [
    /^\/superadmin/,
  ],
  roles: ["SUPER_ADMIN"],
};

function matchRoute(pathname: string, config: RouteConfig): boolean {
  return config.patterns.some((pattern) => pattern.test(pathname));
}

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Allow auth-related routes
  if (pathname.startsWith("/login") ||
      pathname.startsWith("/register") ||
      pathname.startsWith("/api/auth") ||
      pathname.startsWith("/_next") ||
      pathname.startsWith("/favicon")) {
    return NextResponse.next();
  }

  // Check super admin routes first
  if (matchRoute(pathname, superAdminRoutes)) {
    if (!req.auth || !superAdminRoutes.roles?.includes(req.auth.user.role)) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
  }

  // Check admin routes
  if (matchRoute(pathname, adminRoutes)) {
    if (!req.auth || !adminRoutes.roles?.includes(req.auth.user.role)) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
  }

  // Check protected routes
  if (matchRoute(pathname, protectedRoutes)) {
    if (!req.auth) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api/health|_next/static|_next/image|favicon.ico).*)"],
};
