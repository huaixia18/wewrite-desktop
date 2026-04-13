import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

// 生成封面图提示词
function buildCoverPrompt(title: string, content: string): string {
  const keywords = title.slice(0, 10).replace(/[：:]/g, "");
  return `微信公众号封面图，主题：${keywords}，风格：简约大气，现代感，扁平插画风格，暖色调，无文字，适合社交媒体传播，16:9比例，高清晰度`;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { title, content } = await req.json();
  const prompt = buildCoverPrompt(title, content);

  // 模拟返回（实际项目中应调用 DALL-E / Midjourney / 国产图 API）
  // 返回 Unsplash 占位图
  const imageUrl = `https://picsum.photos/seed/${encodeURIComponent(title)}/900/506`;

  return NextResponse.json({ imageUrl, prompt });
}
