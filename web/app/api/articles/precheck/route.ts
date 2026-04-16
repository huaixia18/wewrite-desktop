import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

type CheckStatus = "pass" | "warn" | "fail";

type CheckItem = {
  id: string;
  label: string;
  status: CheckStatus;
  message: string;
};

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const body = (await req.json()) as {
    title?: string;
    content?: string;
    seoTitle?: string;
    seoAbstract?: string;
    seoTags?: string[];
    coverImageUrl?: string;
    previewHtml?: string;
    compositeScore?: number;
  };

  const title = (body.title ?? "").trim();
  const content = (body.content ?? "").trim();
  const previewHtml = (body.previewHtml ?? "").trim();
  const plainLength = content.replace(/[#*`>\n]/g, "").length;

  const checks: CheckItem[] = [
    {
      id: "title",
      label: "标题完整性",
      status: title ? "pass" : "fail",
      message: title ? "标题已填写。" : "缺少标题，请先完善。",
    },
    {
      id: "content",
      label: "正文长度",
      status: plainLength >= 1000 ? "pass" : plainLength >= 600 ? "warn" : "fail",
      message:
        plainLength >= 1000
          ? `正文字数 ${plainLength}，可发布。`
          : plainLength >= 600
            ? `正文字数 ${plainLength}，建议继续补充。`
            : `正文字数 ${plainLength}，不足以发布。`,
    },
    {
      id: "preview",
      label: "排版预览",
      status: previewHtml ? "pass" : "fail",
      message: previewHtml ? "已生成发布预览。" : "尚未生成预览 HTML。",
    },
    {
      id: "seo",
      label: "SEO 元信息",
      status:
        body.seoTitle?.trim() && body.seoAbstract?.trim()
          ? "pass"
          : body.seoTitle?.trim() || body.seoAbstract?.trim()
            ? "warn"
            : "fail",
      message:
        body.seoTitle?.trim() && body.seoAbstract?.trim()
          ? "SEO 标题与摘要已准备。"
          : "建议补全 SEO 标题和摘要。",
    },
    {
      id: "cover",
      label: "封面图片",
      status: body.coverImageUrl?.trim() ? "pass" : "warn",
      message: body.coverImageUrl?.trim() ? "封面图已设置。" : "未设置封面图，发布效果会受影响。",
    },
    {
      id: "quality",
      label: "质量评分",
      status:
        typeof body.compositeScore === "number"
          ? body.compositeScore >= 75
            ? "pass"
            : body.compositeScore >= 60
              ? "warn"
              : "fail"
          : "warn",
      message:
        typeof body.compositeScore === "number"
          ? `当前综合分 ${Math.round(body.compositeScore)}。`
          : "尚未生成综合分，建议先运行验证。",
    },
  ];

  const failed = checks.filter((item) => item.status === "fail");
  const warned = checks.filter((item) => item.status === "warn");

  return NextResponse.json({
    ok: failed.length === 0,
    summary: {
      passed: checks.length - failed.length - warned.length,
      warned: warned.length,
      failed: failed.length,
    },
    checks,
  });
}
