/**
 * auth.config.ts — 仅包含 middleware 需要的部分（无 Prisma，兼容 Edge Runtime）
 *
 * NextAuth v5 middleware 必须用这个不含 Prisma 的配置，
 * 否则 Prisma 的 crypto 依赖会导致 Edge Runtime 报错。
 */
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";

export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "邮箱", type: "email" },
        password: { label: "密码", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const { prisma } = await import("@/lib/prisma");
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });
        if (!user || !user.passwordHash) return null;
        const isValid = await compare(credentials.password as string, user.passwordHash);
        if (!isValid) return null;
        return { id: user.id, email: user.email, name: user.nickname, image: user.avatarUrl };
      },
    }),
  ],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = nextUrl;
      const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/register") || pathname === "/" || pathname === "/pricing";
      const isApiAuth = pathname.startsWith("/api/auth");
      if (isAuthRoute) {
        if (isLoggedIn) return Response.redirect(new URL("/write", nextUrl));
        return true;
      }
      if (!isApiAuth && !isLoggedIn) {
        return Response.redirect(new URL("/login", nextUrl));
      }
      return true;
    },
  },
};
