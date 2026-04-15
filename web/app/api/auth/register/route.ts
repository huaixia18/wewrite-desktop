import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const { email, password, nickname } = await request.json();

  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  const normalizedNickname = typeof nickname === "string" ? nickname.trim() : "";

  if (!normalizedEmail || !password || !normalizedNickname) {
    return NextResponse.json({ error: "请完整填写注册信息" }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: "密码至少需要 6 位" }, { status: 400 });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalizedEmail)) {
    return NextResponse.json({ error: "邮箱格式不正确" }, { status: 400 });
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true },
  });

  if (existingUser) {
    return NextResponse.json({ error: "该邮箱已经注册过了" }, { status: 409 });
  }

  const passwordHash = await hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      nickname: normalizedNickname,
      passwordHash,
      lastLoginAt: new Date(),
    },
    select: {
      id: true,
      email: true,
      nickname: true,
    },
  });

  return NextResponse.json({ ok: true, user });
}
