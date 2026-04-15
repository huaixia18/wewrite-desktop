import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  // 只拦截 API 路由和认证路由，其余页面路由完全由 App Router 处理
  matcher: ["/api/:path*", "/auth/:path*"],
};
