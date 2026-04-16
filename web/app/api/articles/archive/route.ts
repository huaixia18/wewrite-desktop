import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const body = (await req.json()) as {
    id?: string;
    title?: string;
    content?: string;
    htmlContent?: string;
    topic?: unknown;
    framework?: string | null;
    enhanceStrategy?: string | null;
    keywords?: string[];
    wordCount?: number;
    compositeScore?: number;
    qualityReport?: unknown;
    humanizerReport?: unknown;
    seoTitle?: string | null;
    seoAbstract?: string | null;
    seoTags?: string[];
    coverImageUrl?: string | null;
    coverPrompt?: string | null;
    mediaId?: string | null;
    archiveMeta?: Record<string, unknown>;
  };

  const baseData = {
    title: body.title?.trim() || "未命名",
    content: body.content ?? "",
    htmlContent: body.htmlContent ?? null,
    status: "archived" as const,
    topicSource: body.topic ?? undefined,
    framework: body.framework ?? null,
    enhanceStrategy: body.enhanceStrategy ?? null,
    keywords: body.keywords ?? [],
    wordCount:
      typeof body.wordCount === "number"
        ? body.wordCount
        : (body.content ?? "").replace(/[#*`>\n]/g, "").length,
    compositeScore:
      typeof body.compositeScore === "number" ? body.compositeScore : null,
    qualityReport:
      body.qualityReport && typeof body.qualityReport === "object"
        ? body.qualityReport
        : undefined,
    humanizerReport:
      body.humanizerReport && typeof body.humanizerReport === "object"
        ? body.humanizerReport
        : undefined,
    seoTitle: body.seoTitle ?? null,
    seoAbstract: body.seoAbstract ?? null,
    seoTags: body.seoTags ?? [],
    coverImageUrl: body.coverImageUrl ?? null,
    coverPrompt: body.coverPrompt ?? null,
    mediaId: body.mediaId ?? null,
    writingConfig: {
      archivedAt: new Date().toISOString(),
      ...(body.archiveMeta ?? {}),
    },
  };

  if (body.id) {
    const exists = await prisma.article.findFirst({
      where: { id: body.id, userId: session.user.id },
      select: { id: true },
    });
    if (exists) {
      const article = await prisma.article.update({
        where: { id: exists.id },
        data: baseData,
        select: { id: true, status: true, updatedAt: true },
      });
      return NextResponse.json({
        article,
        mode: "updated",
      });
    }
  }

  const article = await prisma.article.create({
    data: {
      userId: session.user.id,
      slug: baseData.title.toLowerCase().replace(/\s+/g, "-"),
      ...baseData,
    },
    select: { id: true, status: true, updatedAt: true },
  });

  return NextResponse.json({
    article,
    mode: "created",
  });
}
