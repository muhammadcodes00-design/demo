import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const session = request.cookies.get("invortech_session")?.value;
  const { pathname } = request.nextUrl;

  const isAuthPage = pathname === "/login";
  const isProtectedPage =
    pathname === "/" ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/products") ||
    pathname.startsWith("/inventory") ||
    pathname.startsWith("/orders") ||
    pathname.startsWith("/customers") ||
    pathname.startsWith("/accounting");

  const isProtectedApi =
    pathname.startsWith("/api/dashboard") ||
    pathname.startsWith("/api/products") ||
    pathname.startsWith("/api/inventory") ||
    pathname.startsWith("/api/orders") ||
    pathname.startsWith("/api/customers") ||
    pathname.startsWith("/api/accounting");

  if (isProtectedApi && !session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isProtectedPage && !session) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthPage && session) {
    const dashboardUrl = new URL("/dashboard", request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  if (pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
