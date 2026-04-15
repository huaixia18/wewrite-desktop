import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Markdown → 微信 HTML 转换器
function markdownToWechatHtml(md: string, theme: string): string {
  let html = md;

  // 基础转译
  html = html
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/^## (.+)$/gm, "<section><h2>$1</h2>")
    .replace(/^### (.+)$/gm, "<section><h3>$1</h3>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/^> (.+)$/gm, "<blockquote><p>$1</p></blockquote>")
    .replace(/^---$/gm, "<hr/>")
    .replace(/<!-- (.+?) -->/g, '<p class="editor-tip">✏️ $1</p>');

  // 容器语法支持
  html = html.replace(
    /:::dialogue\n([\s\S]+?)\n:::/g,
    '<div class="dialogue">$1</div>'
  );
  html = html.replace(
    /:::timeline\n([\s\S]+?)\n:::/g,
    '<div class="timeline">$1</div>'
  );
  html = html.replace(
    /:::callout (\w+)\n([\s\S]+?)\n:::/g,
    '<div class="callout callout-$1">$2</div>'
  );

  // CJK 间距保护
  html = html.replace(/([\u4e00-\u9fa5])([a-zA-Z])/g, "$1 $2");
  html = html.replace(/([a-zA-Z])([\u4e00-\u9fa5])/g, "$1 $2");

  const themeStyles: Record<string, string> = {
    "professional-clean": "#0071e3",
    minimal: "#1d1d1f",
    newspaper: "#000000",
    "tech-modern": "#2997ff",
    bytedance: "#fe2c55",
    github: "#238636",
  };
  const accent = themeStyles[theme] || "#0071e3";

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif; color: #333; line-height: 1.8; max-width: 677px; margin: 0 auto; padding: 20px; }
  h1 { font-size: 24px; font-weight: 600; color: #1d1d1f; margin: 24px 0 16px; }
  h2 { font-size: 20px; font-weight: 600; color: ${accent}; margin: 32px 0 12px; border-left: 4px solid ${accent}; padding-left: 12px; }
  h3 { font-size: 17px; font-weight: 600; color: #444; margin: 20px 0 10px; }
  section { margin: 0 0 16px; }
  p { margin: 0 0 12px; font-size: 15px; }
  blockquote { border-left: 3px solid ${accent}; padding: 8px 16px; background: rgba(0,0,0,0.03); margin: 12px 0; border-radius: 4px; }
  strong { font-weight: 700; color: #1d1d1f; }
  em { font-style: italic; color: #555; }
  code { background: #f5f5f5; padding: 2px 6px; border-radius: 3px; font-family: 'SF Mono', monospace; font-size: 13px; }
  hr { border: none; border-top: 1px solid #eee; margin: 24px 0; }
  .editor-tip { background: #fffbe6; border-left: 3px solid #f59e0b; padding: 8px 12px; border-radius: 4px; font-size: 13px; color: #92400e; }
  .dialogue { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; margin: 12px 0; }
  .timeline { border-left: 2px solid ${accent}; padding-left: 16px; margin: 12px 0; }
  .callout { padding: 12px 16px; border-radius: 8px; margin: 12px 0; }
  .callout-tip { background: #eff6ff; border-left: 3px solid #3b82f6; }
  .callout-warning { background: #fffbeb; border-left: 3px solid #f59e0b; }
  img { max-width: 100%; height: auto; border-radius: 8px; margin: 16px 0; }
</style>
</head>
<body>${html}</body>
</html>`;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { title, content, theme, coverImageUrl } = await req.json();
  const html = markdownToWechatHtml(content || "", theme || "professional-clean");

  return NextResponse.json({ html });
}
