import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";
import { ADMIN_SESSION_COOKIE } from "@/lib/admin-session-constants";

const authRoutes = [
  "/tools",
  "/finance",
  "/legal",
  "/banking",
  "/equipment",
  "/orders",
  "/community",
];

function hasAdminSession(req: NextRequest) {
  return Boolean(req.cookies.get(ADMIN_SESSION_COOKIE)?.value);
}

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const role = req.auth?.user?.role;

  if (pathname.startsWith("/admin/login")) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin") && !hasAdminSession(req)) {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  if (pathname.startsWith("/orders/new") && role !== "BIZ_OPC") {
    return NextResponse.redirect(new URL(role ? "/orders" : "/login", req.url));
  }

  const needsAuth = authRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  if (needsAuth && !role) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
