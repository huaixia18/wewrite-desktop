import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createAIClient, type AIProvider } from "@/lib/ai";

const SEO_SYSTEM_PROMPT = `你是一个微信公众号 SEO 专家。请根据文章内容生成最优的 SEO 元数据。`;

function buildSEOPrompt(params: { title: string; content: string }): string {
  const excerpt = params.content
    .replace(/[#*`>\n\[\]]/g, "")
    .replace(/\*\*/g, "")
    .slice(0, 500);

  return `${SEO_SYSTEM_PROMPT}

文章标题：${params.title}
文章摘要（前500字）：
${excerpt}

请生成以下 JSON 格式（直接输出 JSON，不要任何前缀）：
{
  "seoTitle": "SEO优化标题（20-28字，有吸引力）",
  "abstract": "微信公众号摘要（40字以内）",
  "tags": ["标签1", "标签2", "标签3", "标签4", "标签5"]
}`;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { content, title } = await req.json();

  const userConfig = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { aiProvider: true },
  });

  const aiProvider = userConfig?.aiProvider === "openai" ? "openai" : "anthropic";

  const apiKeyOrEnv =
    process.env[`${aiProvider.toUpperCase()}_API_KEY`] ||
    "";

  if (!apiKeyOrEnv || apiKeyOrEnv.includes("placeholder")) {
    // Mock fallback
    const titleWords = (title || content.slice(0, 50)).split(/[，。、]/).filter(Boolean);
    return NextResponse.json({
      seoTitle: `${titleWords[0] || "深度解读"}：${titleWords[1] || "这个被很多人忽视的趋势"}`,
      abstract: content.slice(0, 60).replace(/[#*`>\n]/g, "") + "...",
      tags: ["AI", "创作", "内容", "效率", "未来"],
      meta: { mode: "mock", provider: "mock" },
    });
  }

  try {
    const client = createAIClient(aiProvider as AIProvider);
    const text = await client.chat({
      model: aiProvider === "anthropic" ? "claude-sonnet-4-7-20250514" : "gpt-4o",
      messages: [
        { role: "system", content: SEO_SYSTEM_PROMPT },
        { role: "user", content: buildSEOPrompt({ title, content }) },
      ],
      maxTokens: 1024,
      temperature: 0.5,
    });

    // 提取 JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[0]);
      return NextResponse.json({
        ...data,
        meta: { mode: "live", provider: aiProvider },
      });
    }

    return NextResponse.json({ error: "AI 返回格式解析失败", raw: text }, { status: 500 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
