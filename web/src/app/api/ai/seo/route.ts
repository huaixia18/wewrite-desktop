import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { content, title } = await req.json();

  // 模拟 SEO 生成
  const titleWords = (title || content.slice(0, 50)).split(/[，。、]/).filter(Boolean);
  const seoTitle = `${titleWords[0] || "深度解读"}：${titleWords[1] || "这个被很多人忽视的趋势"}`;
  const abstract = content.slice(0, 60).replace(/[#*`>\n]/g, "") + "...";
  const tags = ["AI", "创作", "内容", "效率", "未来"].slice(0, 5);

  return NextResponse.json({ seoTitle, abstract, tags });
}
