import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createAIClient } from "@/lib/ai";
import {
  getProviderConfig,
  isProvider,
  isProviderConfigured,
  normalizeProvider,
  resolveUserModelForTier,
} from "@/lib/ai-models";
import { resolveSubscriptionTier } from "@/lib/subscription";

/**
 * GET /api/ai/test
 * 测试 AI 连接是否正常
 *
 * Query params:
 *   provider  — "anthropic" | "openai"（可选）
 *   model     — 指定测试模型（可选）
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const queryProvider = searchParams.get("provider");
  const queryModel = searchParams.get("model");

  // 平台托管模式：仅允许选择 provider，不接受用户自定义 key/baseUrl
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

  const provider =
    isProvider(queryProvider)
      ? queryProvider
      : normalizeProvider(userConfig?.aiProvider);

  const tier = resolveSubscriptionTier(userConfig);
  const model = resolveUserModelForTier(provider, queryModel || userConfig?.model, tier);
  const { baseUrl } = getProviderConfig(provider);

  if (!isProviderConfigured(provider)) {
    return NextResponse.json(
      {
        ok: false,
        provider,
        tier,
        baseUrl,
        error: `服务端未配置 ${provider.toUpperCase()}_API_KEY，请联系管理员`,
      },
      { status: 400 }
    );
  }

  try {
    const client = createAIClient(provider);
    const start = Date.now();

    const reply = await client.chat({
      model,
      messages: [
        { role: "user", content: "回复 OK，不要超过 3 个字。" },
      ],
      maxTokens: 10,
      temperature: 0,
    });

    const latency = Date.now() - start;
    const success = reply.trim().length > 0;

    return NextResponse.json({
      ok: success,
      provider,
      model,
      tier,
      baseUrl,
      reply: reply.trim(),
      latency: `${latency}ms`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        ok: false,
        provider,
        tier,
        baseUrl,
        error: message,
      },
      { status: 502 }
    );
  }
}
