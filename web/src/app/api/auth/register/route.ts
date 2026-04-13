import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";

export async function POST(req: NextRequest) {
  const { email, password, nickname } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "缺少必填字段" }, { status: 400 });
  }

  // 检查是否已存在
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "该邮箱已注册" }, { status: 400 });
  }

  const passwordHash = await hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      nickname: nickname || email.split("@")[0],
    },
  });

  return NextResponse.json({ id: user.id, email: user.email });
}
