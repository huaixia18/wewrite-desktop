import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  isModelAllowedForTier,
  isProvider,
  isProviderConfigured,
  normalizeProvider,
  resolveUserModel,
  resolveUserModelForTier,
} from "@/lib/ai-models";
import { getSubscriptionTier, resolveSubscriptionTier } from "@/lib/subscription";

const DEFAULT_STYLE_CONFIG = {
  persona: "midnight-friend",
  humanizerEnabled: true,
  humanizerStrict: "standard",
} as const;

/**
 * GET /api/settings/ai
 * 获取当前用户的 AI 配置
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      aiProvider: true,
      model: true,
      styleConfig: true,
      wechatOpenid: true,
      subscriptionTier: true,
      subscriptionStatus: true,
      subscriptionEndsAt: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "用户不存在" }, { status: 404 });
  }

  let provider = normalizeProvider(user.aiProvider);
  const tier = resolveSubscriptionTier(user);
  let aiConfigured = isProviderConfigured(provider);
  if (!aiConfigured) {
    const fallbackProvider = provider === "openai" ? "anthropic" : "openai";
    if (isProviderConfigured(fallbackProvider)) {
      provider = fallbackProvider;
      aiConfigured = true;
    }
  }

  const model = resolveUserModelForTier(provider, user.model, tier);
  const storedStyleConfig = user.styleConfig as Record<string, unknown> | null;
  const styleConfig = {
    ...DEFAULT_STYLE_CONFIG,
    ...(storedStyleConfig ?? {}),
  };
  const styleConfigured = true;

  return NextResponse.json({
    aiProvider: provider,
    aiManaged: true,
    aiProviderReady: aiConfigured,
    model,
    styleConfig: styleConfig ?? {},
    onboarding: {
      aiConfigured,
      styleConfigured,
      wechatConfigured: Boolean(user.wechatOpenid),
      wechatRequired: false,
    },
    tier,
  });
}

/**
 * PUT /api/settings/ai
 * 保存当前用户的 AI 配置
 */
export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const body = (await req.json()) as {
    aiProvider?: string;
    model?: string;
    styleConfig?: Record<string, unknown>;
  };
  const { aiProvider, model, styleConfig } = body;

  if (!isProvider(aiProvider)) {
    return NextResponse.json({ error: "无效的 AI 提供商" }, { status: 400 });
  }

  try {
    const tier = await getSubscriptionTier(session.user.id);
    const requestedModel = typeof model === "string" ? model : null;
    const resolvedModel = resolveUserModelForTier(aiProvider, requestedModel, tier);
    const trimmedRequestedModel = resolveUserModel(aiProvider, requestedModel);
    const downgraded = !isModelAllowedForTier(aiProvider, trimmedRequestedModel, tier);

    const data: Record<string, unknown> = {
      aiProvider,
      // 平台托管模式：清空用户自定义 Key / 端点
      aiApiKey: null,
      aiBaseUrl: null,
      model: resolvedModel,
    };

    if (styleConfig && typeof styleConfig === "object" && !Array.isArray(styleConfig)) {
      data.styleConfig = styleConfig;
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data,
    });

    return NextResponse.json({
      ok: true,
      tier,
      model: resolvedModel,
      downgraded,
      warning:
        tier === "free" && downgraded
          ? "免费版仅支持基础模型（mini / nano / haiku），已自动切换到可用模型。"
          : null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
