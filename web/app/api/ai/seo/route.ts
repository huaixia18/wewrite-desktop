import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createAIClient } from "@/lib/ai";
import { isProviderConfigured, normalizeProvider, resolveUserModelForTier } from "@/lib/ai-models";
import { resolveSubscriptionTier } from "@/lib/subscription";

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
  if (!session?.user?.id) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { content, title } = await req.json();

  const userConfig = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      aiProvider: true,
      model: true,
      subscriptionTier: true,
      subscriptionStatus: true,
      subscriptionEndsAt: true,
    },
  });

  const aiProvider = normalizeProvider(userConfig?.aiProvider);
  const tier = resolveSubscriptionTier(userConfig);
  const model = resolveUserModelForTier(aiProvider, userConfig?.model, tier);

  if (!isProviderConfigured(aiProvider)) {
    return NextResponse.json(
      { error: "AI 服务未配置，请先在服务端配置有效的网关 Key。" },
      { status: 503 }
    );
  }

  try {
    const client = createAIClient(aiProvider);
    const text = await client.chat({
      model,
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
