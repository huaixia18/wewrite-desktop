import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  const isAuthRoute = nextUrl.pathname.startsWith("/login") ||
    nextUrl.pathname.startsWith("/register") ||
    nextUrl.pathname === "/";

  const isApiAuth = nextUrl.pathname.startsWith("/api/auth");

  // 已登录访问登录页 → 重定向到写作页
  if (isLoggedIn && isAuthRoute) {
    return NextResponse.redirect(new URL("/write", nextUrl));
  }

  // 未登录访问需要认证的页面 → 重定向到登录页
  if (!isLoggedIn && !isAuthRoute && !isApiAuth) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
