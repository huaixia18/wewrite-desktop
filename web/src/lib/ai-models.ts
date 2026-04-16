import "server-only";

import type { AIProvider } from "@/lib/ai";

type ModelSource = "remote" | "fallback";
export type ModelTier = "free" | "pro";
export type ModelVendor = "openai" | "anthropic" | "other";

export interface ModelVendorGroups {
  openai: string[];
  anthropic: string[];
  other: string[];
}

export interface ProviderModelListResult {
  provider: AIProvider;
  baseUrl: string;
  models: string[];
  source: ModelSource;
  error?: string;
}

const PROVIDER_DEFAULT_MODELS: Record<AIProvider, string> = {
  anthropic: "claude-sonnet-4-7-20250514",
  openai: "gpt-4o",
};

const FREE_TIER_FALLBACK_MODELS: Record<AIProvider, string> = {
  anthropic: "claude-3-5-haiku-latest",
  openai: "gpt-4.1-mini",
};

const FREE_TIER_MODEL_CATALOG: Record<AIProvider, string[]> = {
  anthropic: [
    "claude-3-5-haiku-latest",
    "claude-3-5-haiku-20241022",
    "claude-3-haiku-20240307",
  ],
  openai: [
    "gpt-4.1-mini",
    "gpt-4o-mini",
    "gpt-4.1-nano",
    "gpt-5-mini",
    "gpt-5-nano",
    "o4-mini",
  ],
};

function hasUsableApiKey(apiKey: string): boolean {
  return Boolean(apiKey && !apiKey.includes("placeholder"));
}

function uniqueNonEmpty(items: string[]): string[] {
  const out: string[] = [];
  for (const item of items) {
    const value = item.trim();
    if (!value) continue;
    if (!out.includes(value)) out.push(value);
  }
  return out;
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.trim().replace(/\/+$/, "");
}

function getSharedGatewayApiKey(): string {
  return (
    process.env.AI_GATEWAY_API_KEY ??
    process.env.OPENAI_API_KEY ??
    process.env.ANTHROPIC_API_KEY ??
    ""
  ).trim();
}

function getSharedGatewayBaseUrl(): string {
  return (
    process.env.AI_GATEWAY_BASE_URL ??
    process.env.OPENAI_BASE_URL ??
    process.env.ANTHROPIC_BASE_URL ??
    ""
  ).trim();
}

function buildModelsUrlCandidates(baseUrl: string): string[] {
  const normalized = normalizeBaseUrl(baseUrl);
  if (/\/v1$/i.test(normalized)) {
    return [`${normalized}/models`];
  }
  return [`${normalized}/v1/models`, `${normalized}/models`];
}

export function getDefaultModel(provider: AIProvider): string {
  const envModel = process.env[`${provider.toUpperCase()}_MODEL`]?.trim();
  if (envModel) return envModel;
  return PROVIDER_DEFAULT_MODELS[provider];
}

export function isProvider(value: string | null | undefined): value is AIProvider {
  return value === "anthropic" || value === "openai";
}

export function normalizeProvider(value: string | null | undefined): AIProvider {
  return value === "openai" ? "openai" : "anthropic";
}

export function getProviderConfig(provider: AIProvider): {
  apiKey: string;
  baseUrl: string;
} {
  const gatewayApiKey = (process.env.AI_GATEWAY_API_KEY ?? "").trim();
  const providerApiKey = (process.env[`${provider.toUpperCase()}_API_KEY`] ?? "").trim();
  const sharedApiKey = getSharedGatewayApiKey();
  const apiKey =
    (hasUsableApiKey(gatewayApiKey) ? gatewayApiKey : "") ||
    (hasUsableApiKey(providerApiKey) ? providerApiKey : "") ||
    sharedApiKey;

  const gatewayBaseUrl = (process.env.AI_GATEWAY_BASE_URL ?? "").trim();
  const providerBaseUrl = process.env[`${provider.toUpperCase()}_BASE_URL`] ?? "";
  const sharedBaseUrl = getSharedGatewayBaseUrl();
  const baseUrl =
    gatewayBaseUrl ||
    (hasUsableApiKey(providerApiKey) ? providerBaseUrl : "") ||
    sharedBaseUrl ||
    providerBaseUrl ||
    (provider === "anthropic" ? "https://api.anthropic.com" : "https://api.openai.com");

  return {
    apiKey: apiKey.trim(),
    baseUrl: normalizeBaseUrl(baseUrl),
  };
}

export function isProviderConfigured(provider: AIProvider): boolean {
  const { apiKey } = getProviderConfig(provider);
  return hasUsableApiKey(apiKey);
}

function toTier(tier: string | null | undefined): ModelTier {
  return tier === "pro" ? "pro" : "free";
}

export function detectModelVendor(model: string): ModelVendor {
  const normalized = model.trim().toLowerCase();
  if (!normalized) return "other";
  if (
    normalized.startsWith("gpt-") ||
    normalized.startsWith("text-") ||
    /^o\d/.test(normalized)
  ) {
    return "openai";
  }
  if (normalized.startsWith("claude-")) {
    return "anthropic";
  }
  return "other";
}

function isModelCompatibleWithProvider(provider: AIProvider, model: string): boolean {
  const vendor = detectModelVendor(model);
  if (vendor === "other") return true;
  return vendor === provider;
}

export function resolveUserModel(provider: AIProvider, userModel?: string | null): string {
  const model = typeof userModel === "string" ? userModel.trim() : "";
  return model || getDefaultModel(provider);
}

export function getFreeTierModelFallback(provider: AIProvider): string {
  return FREE_TIER_FALLBACK_MODELS[provider];
}

export function getFreeTierModelCatalog(provider: AIProvider): string[] {
  return [...FREE_TIER_MODEL_CATALOG[provider]];
}

export function groupModelsByVendor(models: string[]): ModelVendorGroups {
  const out: ModelVendorGroups = {
    openai: [],
    anthropic: [],
    other: [],
  };

  for (const model of uniqueNonEmpty(models)) {
    const vendor = detectModelVendor(model);
    out[vendor].push(model);
  }

  return out;
}

export function isModelAllowedForTier(
  provider: AIProvider,
  model: string,
  tier: string | null | undefined
): boolean {
  if (!isModelCompatibleWithProvider(provider, model)) return false;
  if (toTier(tier) === "pro") return true;
  const normalized = model.trim().toLowerCase();
  if (!normalized) return false;
  if (
    normalized.includes("embedding") ||
    normalized.includes("whisper") ||
    normalized.includes("moderation") ||
    normalized.includes("transcribe") ||
    normalized.includes("dall-e") ||
    normalized.includes("image")
  ) {
    return false;
  }

  const freeCatalog = FREE_TIER_MODEL_CATALOG[provider];
  if (freeCatalog.some((item) => item.toLowerCase() === normalized)) return true;

  if (provider === "openai") {
    if (!(normalized.startsWith("gpt-") || normalized.startsWith("o"))) return false;
    return normalized.includes("mini") || normalized.includes("nano");
  }

  return normalized.startsWith("claude-") && normalized.includes("haiku");
}

export function filterModelsByTier(
  provider: AIProvider,
  models: string[],
  tier: string | null | undefined
): string[] {
  const normalizedModels = uniqueNonEmpty(models).filter((model) =>
    isModelCompatibleWithProvider(provider, model)
  );
  if (toTier(tier) === "pro") return normalizedModels;

  const filtered = normalizedModels.filter((model) => isModelAllowedForTier(provider, model, "free"));
  return uniqueNonEmpty([...FREE_TIER_MODEL_CATALOG[provider], ...filtered]).slice(0, 8);
}

export function resolveUserModelForTier(
  provider: AIProvider,
  userModel: string | null | undefined,
  tier: string | null | undefined
): string {
  const resolved = resolveUserModel(provider, userModel);
  if (isModelAllowedForTier(provider, resolved, tier)) return resolved;
  return getFreeTierModelFallback(provider);
}

function parseModelIds(payload: unknown): string[] {
  const objects = (
    Array.isArray(payload)
      ? payload
      : typeof payload === "object" && payload !== null && Array.isArray((payload as { data?: unknown }).data)
        ? (payload as { data: unknown[] }).data
        : typeof payload === "object" && payload !== null && Array.isArray((payload as { models?: unknown }).models)
          ? (payload as { models: unknown[] }).models
          : []
  ) as unknown[];

  const ids = objects
    .map((item) => {
      if (typeof item === "string") return item;
      if (!item || typeof item !== "object") return "";
      const record = item as Record<string, unknown>;
      if (typeof record.id === "string") return record.id;
      if (typeof record.model === "string") return record.model;
      if (typeof record.name === "string") return record.name;
      return "";
    })
    .filter(Boolean);

  return uniqueNonEmpty(ids);
}

async function fetchModelsWithHeaders(
  urls: string[],
  headers: Record<string, string>
): Promise<string[]> {
  for (const url of urls) {
    try {
      const res = await fetch(url, {
        method: "GET",
        headers,
        cache: "no-store",
      });
      if (!res.ok) continue;
      const payload = (await res.json()) as unknown;
      const modelIds = parseModelIds(payload);
      if (modelIds.length > 0) return modelIds;
    } catch {
      // ignore and try next candidate
    }
  }
  return [];
}

export async function fetchProviderModelList(
  provider: AIProvider,
  preferredModel?: string | null
): Promise<ProviderModelListResult> {
  const { apiKey, baseUrl } = getProviderConfig(provider);
  const fallbackModels = uniqueNonEmpty([resolveUserModel(provider, preferredModel)]);

  if (!hasUsableApiKey(apiKey)) {
    return {
      provider,
      baseUrl,
      models: fallbackModels,
      source: "fallback",
      error: `未配置 ${provider.toUpperCase()}_API_KEY`,
    };
  }

  const urls = buildModelsUrlCandidates(baseUrl);
  const openaiHeaders = {
    Authorization: `Bearer ${apiKey}`,
    "content-type": "application/json",
  };

  let models: string[] = [];

  if (provider === "anthropic") {
    models = await fetchModelsWithHeaders(urls, {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    });
    if (models.length === 0) {
      models = await fetchModelsWithHeaders(urls, openaiHeaders);
    }
  } else {
    models = await fetchModelsWithHeaders(urls, openaiHeaders);
  }

  if (models.length > 0) {
    return {
      provider,
      baseUrl,
      models: uniqueNonEmpty([resolveUserModel(provider, preferredModel), ...models]),
      source: "remote",
    };
  }

  return {
    provider,
    baseUrl,
    models: fallbackModels,
    source: "fallback",
    error: "自动拉取模型列表失败，已回退到当前模型",
  };
}
