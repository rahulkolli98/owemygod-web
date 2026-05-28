import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/signup",
  "/auth/forgot-password",
  "/auth/reset-password",
];

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) {
    return true;
  }

  return pathname.startsWith("/invite/") || pathname.startsWith("/demo");
}

function hasAuthSession(request: NextRequest): boolean {
  return !!(request.cookies.get("accessToken") || request.cookies.get("refreshToken"));
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const isProtectedPath =
    pathname === "/dashboard" ||
    pathname === "/profile" ||
    pathname === "/groups" ||
    pathname.startsWith("/groups/");

  if (!isProtectedPath) {
    return NextResponse.next();
  }

  if (hasAuthSession(request)) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", `${pathname}${search}`);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/dashboard/:path*", "/groups/:path*", "/profile/:path*", "/login", "/signup"],
};