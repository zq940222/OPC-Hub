import { NextResponse } from "next/server";
import { auth } from "@/auth";

const authRoutes = [
  "/tools",
  "/finance",
  "/legal",
  "/banking",
  "/equipment",
  "/orders",
  "/community",
];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const role = req.auth?.user?.role;

  if (pathname.startsWith("/admin") && role !== "ADMIN") {
    return NextResponse.redirect(new URL(role ? "/" : "/login", req.url));
  }

  if (pathname.startsWith("/orders/new") && !["BIZ_OPC", "ADMIN"].includes(role ?? "")) {
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
