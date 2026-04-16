import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createAIClient } from "@/lib/ai";
import { isProviderConfigured, normalizeProvider, resolveUserModelForTier } from "@/lib/ai-models";
import { resolveSubscriptionTier } from "@/lib/subscription";

// ─── 封面图 Prompt ────────────────────────────────────────────────────────

function buildCoverPrompt(title: string, content: string): string {
  const summary = content
    .replace(/[#*`>\n\[\]]/g, "")
    .replace(/\*\*/g, "")
    .slice(0, 200);

  return `请为以下微信公众号文章生成封面图提示词（用于 AI 绘图）：

文章标题：${title}
文章摘要：${summary}

要求：
1. 风格：简约大气，现代感，扁平插画风格
2. 色调：暖色调为主，呼应文章情绪
3. 比例：16:9（900x506px）
4. 无文字，纯视觉表达
5. 适合社交媒体传播

请直接输出一段英文 Prompt（用于 DALL-E / Midjourney / Flux 等绘图工具），不超过 200 词。`;
}

// ─── Route Handler ────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { title, content } = await req.json();

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
    const prompt = await client.chat({
      model,
      messages: [
        { role: "system", content: "你是一个创意视觉提示词专家。" },
        { role: "user", content: buildCoverPrompt(title, content) },
      ],
      maxTokens: 512,
      temperature: 0.8,
    });

    // 生成提示词后，调用绘图服务
    const imageGenKey =
      process.env.IMAGE_GEN_API_KEY ??
      process.env.AI_GATEWAY_API_KEY ??
      process.env.OPENAI_API_KEY;
    const imageBaseUrl =
      process.env.IMAGE_GEN_BASE_URL ??
      process.env.AI_GATEWAY_BASE_URL ??
      process.env.OPENAI_BASE_URL;

    if (!imageGenKey || !imageBaseUrl) {
      return NextResponse.json(
        {
          error: "未配置绘图服务，请设置 IMAGE_GEN_API_KEY / IMAGE_GEN_BASE_URL 或统一网关变量。",
          prompt,
          meta: { mode: "live", provider: aiProvider },
        },
        { status: 503 }
      );
    }

    const imageRes = await fetch(`${imageBaseUrl}/v1/images/generations`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${imageGenKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt,
        n: 1,
        size: "1792x1024",
      }),
    });

    if (!imageRes.ok) {
      const detail = await imageRes.text();
      return NextResponse.json(
        {
          error: `封面图生成失败（${imageRes.status}）`,
          detail,
          prompt,
          meta: { mode: "live", provider: aiProvider },
        },
        { status: 502 }
      );
    }

    const imageData = await imageRes.json();
    const imageUrl = imageData.data?.[0]?.url ?? "";
    if (!imageUrl) {
      return NextResponse.json(
        {
          error: "绘图服务未返回可用图片 URL",
          prompt,
          meta: { mode: "live", provider: aiProvider },
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      imageUrl,
      prompt,
      meta: { mode: "live", provider: aiProvider },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
