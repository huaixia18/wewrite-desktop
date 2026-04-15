import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

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
    },
  });

  if (!user) {
    return NextResponse.json({ error: "用户不存在" }, { status: 404 });
  }

  const provider = user.aiProvider === "openai" ? "openai" : "anthropic";
  const managedApiKey = process.env[`${provider.toUpperCase()}_API_KEY`] ?? "";
  const aiConfigured = Boolean(managedApiKey && !managedApiKey.includes("placeholder"));
  const styleConfig = user.styleConfig as Record<string, unknown> | null;
  const styleConfigured = Boolean(styleConfig && Object.keys(styleConfig).length > 0);

  return NextResponse.json({
    aiProvider: provider,
    aiManaged: true,
    aiProviderReady: aiConfigured,
    model: user.model,
    styleConfig: styleConfig ?? {},
    onboarding: {
      aiConfigured,
      styleConfigured,
      wechatConfigured: Boolean(user.wechatOpenid),
    },
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

  if (!aiProvider || !["anthropic", "openai"].includes(aiProvider)) {
    return NextResponse.json({ error: "无效的 AI 提供商" }, { status: 400 });
  }

  try {
    const data: Record<string, unknown> = {
      aiProvider,
      // 平台托管模式：清空用户自定义 Key / 端点
      aiApiKey: null,
      aiBaseUrl: null,
    };

    if (typeof model === "string" && model.trim()) {
      data.model = model.trim();
    }

    if (styleConfig && typeof styleConfig === "object" && !Array.isArray(styleConfig)) {
      data.styleConfig = styleConfig;
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
