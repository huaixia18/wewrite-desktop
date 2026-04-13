import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "draft";
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = 20;

  const articles = await prisma.article.findMany({
    where: { userId: session.user.id, status },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * limit,
    take: limit,
    select: {
      id: true,
      title: true,
      status: true,
      wordCount: true,
      compositeScore: true,
      humanizerHits: true,
      seoTags: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const total = await prisma.article.count({
    where: { userId: session.user.id, status },
  });

  return NextResponse.json({ articles, total, page, limit });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const body = await req.json();
  const article = await prisma.article.create({
    data: {
      userId: session.user.id,
      title: body.title || "未命名",
      content: body.content ?? "",
      slug: body.title?.toLowerCase().replace(/\s+/g, "-"),
      status: body.status ?? "draft",
      topicSource: body.topic ?? undefined,
      framework: body.framework,
      enhanceStrategy: body.enhanceStrategy,
      keywords: body.keywords ?? [],
      wordCount: body.content?.replace(/[#*`>\n]/g, "").length ?? 0,
    },
  });

  return NextResponse.json({ article });
}
