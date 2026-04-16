import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type DimensionScore = {
  score: number;
  detail: string;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function scoreLength(content: string): DimensionScore {
  const length = content.replace(/[#*`>\n]/g, "").length;
  if (length >= 1500 && length <= 2600) {
    return { score: 92, detail: `正文长度 ${length} 字，处于推荐区间。` };
  }
  if (length >= 1000 && length < 1500) {
    return { score: 80, detail: `正文长度 ${length} 字，略短，建议补充案例和数据。` };
  }
  if (length > 2600) {
    return { score: 78, detail: `正文长度 ${length} 字，略长，建议精简重复段落。` };
  }
  return { score: 62, detail: `正文长度 ${length} 字，明显不足。` };
}

function scoreStructure(content: string): DimensionScore {
  const h2Count = (content.match(/^##\s+/gm) ?? []).length;
  const paragraphCount = content
    .split(/\n{2,}/)
    .map((item) => item.trim())
    .filter(Boolean).length;

  let score = 65;
  if (h2Count >= 3 && h2Count <= 6) score += 20;
  if (paragraphCount >= 8) score += 10;
  if (content.includes("<!-- ✏️编辑建议 -->")) score += 5;

  return {
    score: clamp(score, 0, 100),
    detail: `H2 ${h2Count} 个，段落 ${paragraphCount} 个。`,
  };
}

function scoreSeo(params: {
  title: string;
  seoTitle?: string;
  seoAbstract?: string;
  seoTags?: string[];
  keywords?: string[];
}): DimensionScore {
  let score = 60;
  const notes: string[] = [];
  if (params.seoTitle?.trim()) {
    score += 15;
    notes.push("SEO 标题已填写");
  } else {
    notes.push("缺少 SEO 标题");
  }
  if (params.seoAbstract?.trim()) {
    score += 10;
    notes.push("SEO 摘要已填写");
  } else {
    notes.push("缺少 SEO 摘要");
  }
  if ((params.seoTags ?? []).length >= 3) {
    score += 10;
    notes.push("SEO 标签数量充足");
  } else {
    notes.push("SEO 标签偏少");
  }
  const merged = `${params.title} ${params.seoTitle ?? ""} ${params.seoAbstract ?? ""}`;
  const kwHits = (params.keywords ?? []).filter((kw) => kw && merged.includes(kw)).length;
  if (kwHits >= 2) {
    score += 10;
    notes.push("关键词覆盖良好");
  } else if ((params.keywords ?? []).length > 0) {
    notes.push("关键词覆盖不足");
  }
  return { score: clamp(score, 0, 100), detail: notes.join("；") };
}

function scoreFactualRisk(content: string): DimensionScore {
  const pendingCount = (content.match(/【待核实】/g) ?? []).length;
  const score = clamp(90 - pendingCount * 8, 40, 95);
  return {
    score,
    detail:
      pendingCount > 0
        ? `检测到 ${pendingCount} 处“待核实”标记，建议补充信源。`
        : "未检测到高风险待核实标记。",
  };
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const body = (await req.json()) as {
    articleId?: string;
    title?: string;
    content?: string;
    seoTitle?: string;
    seoAbstract?: string;
    seoTags?: string[];
    keywords?: string[];
    humanizerScore?: number;
  };

  const title = (body.title ?? "").trim();
  const content = body.content ?? "";
  if (!title || !content.trim()) {
    return NextResponse.json({ error: "标题和正文不能为空" }, { status: 400 });
  }

  const lengthScore = scoreLength(content);
  const structureScore = scoreStructure(content);
  const seoScore = scoreSeo({
    title,
    seoTitle: body.seoTitle,
    seoAbstract: body.seoAbstract,
    seoTags: body.seoTags,
    keywords: body.keywords,
  });
  const factualScore = scoreFactualRisk(content);
  const humanizerScore = clamp(Math.round(body.humanizerScore ?? 70), 0, 100);

  const compositeScore = clamp(
    Math.round(
      lengthScore.score * 0.2 +
        structureScore.score * 0.24 +
        seoScore.score * 0.24 +
        factualScore.score * 0.12 +
        humanizerScore * 0.2
    ),
    0,
    100
  );

  const qualityReport = {
    dimensions: {
      length: lengthScore,
      structure: structureScore,
      seo: seoScore,
      factual: factualScore,
      humanizer: {
        score: humanizerScore,
        detail: `基于 Humanizer 检测结果评分 ${humanizerScore}。`,
      },
    },
    checks: [
      {
        key: "minimum_length",
        passed: content.replace(/[#*`>\n]/g, "").length >= 1000,
        message: "正文字数应至少 1000 字",
      },
      {
        key: "has_h2",
        passed: /^##\s+/m.test(content),
        message: "建议至少包含一个 H2 小节",
      },
      {
        key: "seo_ready",
        passed: Boolean(body.seoTitle?.trim() && body.seoAbstract?.trim()),
        message: "建议补全 SEO 标题和摘要",
      },
    ],
  };

  if (body.articleId) {
    const exists = await prisma.article.findFirst({
      where: { id: body.articleId, userId: session.user.id },
      select: { id: true },
    });
    if (exists) {
      await prisma.article.update({
        where: { id: exists.id },
        data: {
          compositeScore,
          qualityReport,
          seoTitle: body.seoTitle ?? null,
          seoAbstract: body.seoAbstract ?? null,
          seoTags: body.seoTags ?? [],
        },
      });
    }
  }

  return NextResponse.json({
    compositeScore,
    qualityReport,
  });
}
