import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  fetchProviderModelList,
  filterModelsByTier,
  groupModelsByVendor,
  isProvider,
  normalizeProvider,
  resolveUserModelForTier,
  type ProviderModelListResult,
} from "@/lib/ai-models";
import type { AIProvider } from "@/lib/ai";
import { resolveSubscriptionTier } from "@/lib/subscription";

/**
 * GET /api/ai/models
 * 拉取当前 provider 的可用模型列表（优先远程，失败回退当前模型）
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const queryProvider = searchParams.get("provider");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      aiProvider: true,
      model: true,
      subscriptionTier: true,
      subscriptionStatus: true,
      subscriptionEndsAt: true,
    },
  });

  const provider: AIProvider = isProvider(queryProvider)
    ? queryProvider
    : normalizeProvider(user?.aiProvider);
  const tier = resolveSubscriptionTier(user);
  const selectedModel = resolveUserModelForTier(provider, user?.model, tier);

  let result: ProviderModelListResult;
  try {
    result = await fetchProviderModelList(provider, selectedModel);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const fallbackModels = filterModelsByTier(provider, [selectedModel], tier);
    return NextResponse.json(
      {
        provider,
        baseUrl: "",
        models: fallbackModels,
        vendorGroups: groupModelsByVendor(fallbackModels),
        source: "fallback",
        selectedModel,
        tier,
        error: message,
      },
      { status: 200 }
    );
  }

  const models = filterModelsByTier(provider, result.models, tier);
  return NextResponse.json({
    provider,
    baseUrl: result.baseUrl,
    models,
    vendorGroups: groupModelsByVendor(models),
    source: result.source,
    selectedModel,
    tier,
    error: result.error,
  });
}
