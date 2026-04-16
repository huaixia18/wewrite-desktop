import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const articleId = searchParams.get("id");
  const status = searchParams.get("status") ?? "draft";
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 50);
  const includeContent = searchParams.get("includeContent") === "1";

  if (articleId) {
    const article = await prisma.article.findFirst({
      where: { id: articleId, userId: session.user.id },
      select: {
        id: true,
        title: true,
        status: true,
        content: true,
        htmlContent: true,
        topicSource: true,
        framework: true,
        enhanceStrategy: true,
        keywords: true,
        wordCount: true,
        seoTitle: true,
        seoAbstract: true,
        seoTags: true,
        coverImageUrl: true,
        coverPrompt: true,
        humanizerReport: true,
        mediaId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!article) {
      return NextResponse.json({ error: "文章不存在" }, { status: 404 });
    }

    return NextResponse.json({ article });
  }

  const baseSelect = {
    id: true,
    title: true,
    status: true,
    wordCount: true,
    compositeScore: true,
    humanizerHits: true,
    seoTags: true,
    createdAt: true,
    updatedAt: true,
  };

  const articles = await prisma.article.findMany({
    where: { userId: session.user.id, status },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * limit,
    take: limit,
    select: includeContent
      ? {
          ...baseSelect,
          content: true,
          topicSource: true,
          framework: true,
          enhanceStrategy: true,
          keywords: true,
          seoTitle: true,
          seoAbstract: true,
          coverImageUrl: true,
          coverPrompt: true,
          humanizerReport: true,
          mediaId: true,
        }
      : baseSelect,
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
      compositeScore:
        typeof body.compositeScore === "number" ? body.compositeScore : undefined,
      qualityReport:
        body.qualityReport && typeof body.qualityReport === "object"
          ? body.qualityReport
          : undefined,
    },
  });

  return NextResponse.json({ article });
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const body = await req.json();
  const articleId = typeof body.id === "string" ? body.id : undefined;

  const payload = {
    title: body.title || "未命名",
    content: body.content ?? "",
    htmlContent: body.htmlContent ?? null,
    slug: body.title?.toLowerCase().replace(/\s+/g, "-"),
    status: body.status ?? "draft",
    topicSource: body.topic ?? undefined,
    framework: body.framework ?? null,
    enhanceStrategy: body.enhanceStrategy ?? null,
    keywords: body.keywords ?? [],
    wordCount: body.content?.replace(/[#*`>\n]/g, "").length ?? 0,
    seoTitle: body.seoTitle ?? null,
    seoAbstract: body.seoAbstract ?? null,
    seoTags: body.seoTags ?? [],
    coverImageUrl: body.coverImageUrl ?? null,
    coverPrompt: body.coverPrompt ?? null,
    mediaId: body.mediaId ?? null,
    humanizerReport: body.humanizerReport ?? undefined,
    compositeScore:
      typeof body.compositeScore === "number" ? body.compositeScore : undefined,
    qualityReport:
      body.qualityReport && typeof body.qualityReport === "object"
        ? body.qualityReport
        : undefined,
  };

  if (articleId) {
    const exists = await prisma.article.findFirst({
      where: { id: articleId, userId: session.user.id },
      select: { id: true },
    });

    if (exists) {
      const article = await prisma.article.update({
        where: { id: exists.id },
        data: payload,
      });
      return NextResponse.json({ article, mode: "updated" });
    }
  }

  const article = await prisma.article.create({
    data: {
      userId: session.user.id,
      ...payload,
    },
  });

  return NextResponse.json({ article, mode: "created" });
}
