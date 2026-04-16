"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchJson } from "@/lib/http";
import { cn } from "@/lib/utils";
import { StepStatusAlert } from "@/components/pipeline/StepStatusAlert";
import {
  Save,
  CheckCircle2,
  Loader2,
  Wifi,
  XCircle,
  Zap,
  CreditCard,
  ExternalLink,
  RefreshCcw,
} from "lucide-react";

/* ─── Apple Settings Page ─────────────────────────────────────────────
 * Light section header, white cards, pill tabs
 * Apple typography, clean spacing
 */
const PERSONAS = [
  {
    id: "midnight-friend",
    name: "深夜朋友",
    desc: "第一人称，极口语化，像在和读者聊天",
    emoji: "🌙",
  },
  {
    id: "warm-editor",
    name: "温暖编辑",
    desc: "叙事温暖，故事嵌套数据",
    emoji: "🌸",
  },
  {
    id: "industry-observer",
    name: "行业观察者",
    desc: "中性分析，数据驱动",
    emoji: "🔍",
  },
  {
    id: "sharp-journalist",
    name: "锐利记者",
    desc: "观点鲜明，数据支撑",
    emoji: "⚡",
  },
  {
    id: "cold-analyst",
    name: "冷静分析师",
    desc: "克制严谨，逻辑严密",
    emoji: "❄️",
  },
];

const AI_PROVIDERS = [
  {
    id: "anthropic",
    name: "Claude",
    color: "#f97316",
    bg: "bg-[#f97316]/10",
    border: "border-[#f97316]/20",
  },
  {
    id: "openai",
    name: "GPT-4",
    color: "#22c55e",
    bg: "bg-[#22c55e]/10",
    border: "border-[#22c55e]/20",
  },
];

const HUMANIZER_LEVELS = [
  { id: "relaxed", label: "宽松", desc: "仅修复高置信度命中（7+ 条规则同时触发）" },
  { id: "standard", label: "标准", desc: "修复所有命中规则（推荐）" },
  { id: "strict", label: "严格", desc: "标准模式 + 反 AI 审计二次修复" },
] as const;

interface TestResult {
  ok: boolean;
  provider: string;
  baseUrl: string;
  model?: string;
  tier?: AccessTier;
  reply?: string;
  latency?: string;
  error?: string;
}

type AccessTier = "free" | "pro";
type ModelVendor = "openai" | "anthropic" | "other";

interface ModelVendorGroups {
  openai: string[];
  anthropic: string[];
  other: string[];
}

interface SubscriptionStatus {
  tier: AccessTier;
  status: string;
  isActive: boolean;
  endsAt: string | null;
  hasStripe: boolean;
}

interface SettingsResponse {
  aiProvider?: string;
  aiProviderReady?: boolean;
  model?: string;
  tier?: AccessTier;
  styleConfig?: {
    persona?: string;
    humanizerEnabled?: boolean;
    humanizerStrict?: "relaxed" | "standard" | "strict";
  };
}

interface ModelListResponse {
  models?: unknown[];
  selectedModel?: string;
  vendorGroups?: Partial<Record<ModelVendor, unknown>>;
  tier?: AccessTier;
  source?: string;
  error?: string;
}

interface SubscriptionStatusResponse extends SubscriptionStatus {
  error?: string;
}

interface SaveSettingsResponse {
  ok?: boolean;
  tier?: AccessTier;
  model?: string;
  warning?: string | null;
}

const SETTINGS_TABS = ["account", "subscription", "ai", "style", "wechat"] as const;
type SettingsTab = (typeof SETTINGS_TABS)[number];

function uniqueModels(items: string[]): string[] {
  const out: string[] = [];
  for (const item of items) {
    const model = item.trim();
    if (!model) continue;
    if (!out.includes(model)) out.push(model);
  }
  return out;
}

const FREE_TIER_FALLBACK_MODELS: Record<string, string> = {
  anthropic: "claude-3-5-haiku-latest",
  openai: "gpt-4.1-mini",
};

const MODEL_VENDOR_LABELS: Record<ModelVendor, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic",
  other: "其他兼容模型",
};

function fallbackModel(provider: string, tier: AccessTier = "pro"): string {
  if (tier === "free") {
    return FREE_TIER_FALLBACK_MODELS[provider] ?? FREE_TIER_FALLBACK_MODELS.anthropic;
  }
  return provider === "openai" ? "gpt-4o" : "claude-sonnet-4-7-20250514";
}

function normalizeModelGroups(
  groups: Partial<Record<ModelVendor, unknown>> | undefined,
  fallbackModels: string[]
): ModelVendorGroups {
  const normalized: ModelVendorGroups = {
    openai: [],
    anthropic: [],
    other: [],
  };

  if (groups && typeof groups === "object") {
    for (const vendor of ["openai", "anthropic", "other"] as const) {
      const list = groups[vendor];
      if (Array.isArray(list)) {
        normalized[vendor] = list.filter((m): m is string => typeof m === "string");
      }
    }
  }

  const total = normalized.openai.length + normalized.anthropic.length + normalized.other.length;
  if (total > 0) return normalized;

  for (const model of fallbackModels) {
    const value = model.trim().toLowerCase();
    if (
      value.startsWith("gpt-") ||
      value.startsWith("text-") ||
      /^o\d/.test(value)
    ) {
      normalized.openai.push(model);
      continue;
    }
    if (value.startsWith("claude-")) {
      normalized.anthropic.push(model);
      continue;
    }
    normalized.other.push(model);
  }

  return normalized;
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const justSubscribed = searchParams.get("subscription") === "success";
  const tabFromQuery = searchParams.get("tab") as SettingsTab | null;
  const initialTab: SettingsTab =
    tabFromQuery && SETTINGS_TABS.includes(tabFromQuery) ? tabFromQuery : "account";

  // AI 配置（从 DB 加载）
  const [nickname, setNickname] = useState(session?.user?.name ?? "");
  const [persona, setPersona] = useState("midnight-friend");
  const [aiProvider, setAiProvider] = useState("anthropic");
  const [aiModel, setAiModel] = useState(fallbackModel("anthropic", "free"));
  const [modelTier, setModelTier] = useState<AccessTier>("free");
  const [modelOptions, setModelOptions] = useState<string[]>([]);
  const [modelVendorGroups, setModelVendorGroups] = useState<ModelVendorGroups>({
    openai: [],
    anthropic: [],
    other: [],
  });
  const [modelSource, setModelSource] = useState<"" | "remote" | "fallback">("");
  const [modelLoading, setModelLoading] = useState(false);
  const [modelError, setModelError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [aiProviderReady, setAiProviderReady] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);
  const [humanizerEnabled, setHumanizerEnabled] = useState(true);
  const [humanizerStrict, setHumanizerStrict] = useState<
    "relaxed" | "standard" | "strict"
  >("standard");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // 订阅状态
  const [sub, setSub] = useState<SubscriptionStatus | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState("");

  // 连接测试
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [saveError, setSaveError] = useState("");

  // 页面加载时从 DB 读取用户 AI 配置
  const loadModelOptions = useCallback(async (
    provider: string,
    preferredModel?: string,
    tierHint: AccessTier = "free"
  ) => {
    setModelLoading(true);
    setModelError("");

    try {
      const data = await fetchJson<ModelListResponse>(`/api/ai/models?provider=${encodeURIComponent(provider)}`, {
        cache: "no-store",
      });
      const models = Array.isArray(data.models)
        ? data.models.filter((m: unknown) => typeof m === "string")
        : [];
      const tier = data.tier === "pro" ? "pro" : "free";
      const selectedFromServer =
        typeof data.selectedModel === "string" ? data.selectedModel : "";
      const merged = uniqueModels([selectedFromServer, ...models]);
      const grouped = normalizeModelGroups(data.vendorGroups, merged);

      setModelTier(tier);
      setModelOptions(merged);
      setModelVendorGroups(grouped);
      setModelSource(data.source === "remote" ? "remote" : "fallback");
      setModelError(typeof data.error === "string" ? data.error : "");

      setAiModel((prev) => {
        const current = (selectedFromServer || preferredModel || prev).trim();
        if (current && merged.includes(current)) return current;
        return merged[0] ?? fallbackModel(provider, tier);
      });
    } catch (err) {
      const message = getErrorMessage(err, "模型列表拉取失败");
      const fallback = uniqueModels([preferredModel ?? fallbackModel(provider, tierHint)]);
      setModelOptions(fallback);
      setModelVendorGroups(normalizeModelGroups(undefined, fallback));
      setModelSource("fallback");
      setModelError(message);
      setAiModel((prev) => {
        const current = (preferredModel ?? prev).trim();
        if (current) return current;
        return fallback[0] ?? fallbackModel(provider, tierHint);
      });
    } finally {
      setModelLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!session?.user?.id) return;

    let cancelled = false;

    const loadSettings = async () => {
      try {
        const data = await fetchJson<SettingsResponse>("/api/settings/ai");
        if (cancelled) return;

        setLoadError("");
        const provider = data.aiProvider === "openai" ? "openai" : "anthropic";
        const tier = data.tier === "pro" ? "pro" : "free";
        const model = typeof data.model === "string" ? data.model : fallbackModel(provider, tier);
        setAiProvider(provider);
        setAiModel(model);
        setModelTier(tier);
        setAiProviderReady(Boolean(data.aiProviderReady));
        void loadModelOptions(provider, model, tier);

        if (data.styleConfig && typeof data.styleConfig === "object") {
          const style = data.styleConfig;
          if (style.persona) setPersona(style.persona);
          if (typeof style.humanizerEnabled === "boolean") {
            setHumanizerEnabled(style.humanizerEnabled);
          }
          if (style.humanizerStrict) setHumanizerStrict(style.humanizerStrict);
        }
      } catch (err) {
        if (cancelled) return;
        setLoadError(getErrorMessage(err, "设置加载失败"));
      }
    };

    void loadSettings();
    return () => {
      cancelled = true;
    };
  }, [session?.user?.id, loadModelOptions]);

  useEffect(() => {
    if (!tabFromQuery || !SETTINGS_TABS.includes(tabFromQuery)) return;
    setActiveTab(tabFromQuery);
  }, [tabFromQuery]);

  // 加载订阅状态
  useEffect(() => {
    if (!session?.user?.id) return;

    let cancelled = false;

    const loadSubscription = async () => {
      try {
        const data = await fetchJson<SubscriptionStatusResponse>("/api/subscriptions/status");
        if (cancelled) return;
        if (!data.error) {
          setSub(data);
          setModelTier(data.tier === "pro" ? "pro" : "free");
        }
        setSubscriptionError("");
      } catch (err) {
        if (cancelled) return;
        setSub(null);
        setSubscriptionError(getErrorMessage(err, "订阅状态加载失败"));
      }
    };

    void loadSubscription();
    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);

  const handleSave = async () => {
    setSaving(true);
    setSaveError("");
    try {
      const payload: Record<string, unknown> = {
        aiProvider,
        model: aiModel.trim() || fallbackModel(aiProvider, modelTier),
        styleConfig: {
          persona,
          humanizerEnabled,
          humanizerStrict,
        },
      };

      const saveData = await fetchJson<SaveSettingsResponse>("/api/settings/ai", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (saveData.tier) {
        setModelTier(saveData.tier);
      }
      if (typeof saveData.model === "string" && saveData.model.trim()) {
        setAiModel(saveData.model);
      }
      if (saveData.warning) {
        setModelError(saveData.warning);
      }

      const finalModel = saveData.model?.trim() || aiModel.trim() || fallbackModel(aiProvider, modelTier);

      const checkParams = new URLSearchParams({
        provider: aiProvider,
        model: finalModel,
      });
      const checkData = await fetchJson<TestResult>(`/api/ai/test?${checkParams}`);
      setAiProviderReady(Boolean(checkData.ok));
      void loadModelOptions(aiProvider, finalModel, saveData.tier ?? modelTier);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setSaveError(getErrorMessage(err, "保存失败，请稍后重试"));
    } finally {
      setSaving(false);
    }
  };

  const handleProviderChange = (id: string) => {
    setAiProvider(id);
    setAiProviderReady(false);
    setTestResult(null);
    const model = fallbackModel(id, modelTier);
    setAiModel(model);
    void loadModelOptions(id, model, modelTier);
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const params = new URLSearchParams({
        provider: aiProvider,
        model: aiModel.trim() || fallbackModel(aiProvider, modelTier),
      });

      const res = await fetch(`/api/ai/test?${params}`);
      const data = await res.json();
      setTestResult(data);
      setAiProviderReady(Boolean(data.ok));
    } catch (err) {
      setTestResult({
        ok: false,
        provider: aiProvider,
        baseUrl: "",
        error: err instanceof Error ? err.message : "网络错误",
      });
    } finally {
      setTesting(false);
    }
  };

  const handleOpenPortal = async () => {
    setPortalLoading(true);
    setSubscriptionError("");
    try {
      const data = await fetchJson<{ url?: string }>("/api/subscriptions/portal", {
        method: "POST",
      });
      if (!data.url) {
        throw new Error("未获取到订阅管理链接");
      }
      window.location.href = data.url;
    } catch (err) {
      setSubscriptionError(getErrorMessage(err, "订阅中心暂时不可用"));
    } finally {
      setPortalLoading(false);
    }
  };

  const selectedProvider =
    AI_PROVIDERS.find((p) => p.id === aiProvider) ?? AI_PROVIDERS[0];
  const isProTier = modelTier === "pro" || Boolean(sub?.isActive);
  const subscriptionLabel = isProTier ? "Pro" : "Free";
  const subscriptionTone = isProTier ? "text-[#34c759]" : "text-[rgba(0,0,0,0.62)]";

  return (
    <div className="min-h-screen bg-[#f3f6fb] pb-24 sm:pb-0">
      {/* ── Page Header ── */}
      <div className="px-6 pt-4 lg:px-8">
        <div className="mx-auto max-w-[1200px] rounded-[24px] border border-black/[0.06] bg-white px-6 py-5 shadow-[rgba(0,0,0,0.04)_0_8px_20px_-12px]">
          <p className="text-[11px] uppercase tracking-[0.12em] text-[rgba(0,0,0,0.42)]">System</p>
          <h1 className="mt-1 text-[26px] font-semibold tracking-[-0.24px] leading-[1.2] text-[#0f172a]">
            设置
          </h1>
          <p className="mt-1 text-[13px] leading-[1.5] tracking-[-0.12px] text-[rgba(0,0,0,0.52)]">
            配置你的 AI 写作偏好
          </p>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="mx-auto max-w-[1200px] px-6 py-8 lg:px-8">
        {loadError && (
          <div className="mb-6">
            <StepStatusAlert
              variant="error"
              title="设置加载失败"
              description={loadError}
            />
          </div>
        )}
        <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-black/[0.06] bg-white px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.12em] text-[rgba(0,0,0,0.4)]">账号</p>
            <p className="mt-1 text-[14px] font-medium tracking-[-0.16px] text-[#111827]">
              {session?.user?.email ? "已登录" : "待完善"}
            </p>
            <p className="mt-0.5 truncate text-[12px] text-[rgba(0,0,0,0.48)]">{session?.user?.email ?? "暂无邮箱"}</p>
          </div>
          <div className="rounded-2xl border border-black/[0.06] bg-white px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.12em] text-[rgba(0,0,0,0.4)]">订阅</p>
            <p className={cn("mt-1 text-[14px] font-medium tracking-[-0.16px]", subscriptionTone)}>
              {subscriptionLabel}
            </p>
            <p className="mt-0.5 text-[12px] text-[rgba(0,0,0,0.48)]">
              {sub?.isActive ? "高级功能已解锁" : "可升级解锁完整能力"}
            </p>
          </div>
          <div className="rounded-2xl border border-black/[0.06] bg-white px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.12em] text-[rgba(0,0,0,0.4)]">AI 服务</p>
            <p className={cn("mt-1 text-[14px] font-medium tracking-[-0.16px]", aiProviderReady ? "text-[#34c759]" : "text-[#ff3b30]")}>
              {aiProviderReady ? "服务可用" : "服务未就绪"}
            </p>
            <p className="mt-0.5 truncate text-[12px] text-[rgba(0,0,0,0.48)]">
              {selectedProvider.name} · {aiModel}
            </p>
          </div>
          <div className="rounded-2xl border border-black/[0.06] bg-white px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.12em] text-[rgba(0,0,0,0.4)]">写作风格</p>
            <p className="mt-1 text-[14px] font-medium tracking-[-0.16px] text-[#111827]">
              {PERSONAS.find((p) => p.id === persona)?.name ?? "未设置"}
            </p>
            <p className="mt-0.5 text-[12px] text-[rgba(0,0,0,0.48)]">Humanizer：{humanizerEnabled ? "开启" : "关闭"}</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as SettingsTab)} className="space-y-6">
          <TabsList
            variant="default"
            className="mb-2 w-full justify-start gap-1 overflow-x-auto bg-transparent p-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {[
              { value: "account", label: "账号" },
              { value: "subscription", label: "订阅" },
              { value: "ai", label: "AI" },
              { value: "style", label: "风格" },
              { value: "wechat", label: "微信" },
            ].map(({ value, label }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="shrink-0 rounded-full px-[18px] py-[7px] text-[14px] font-medium text-[#1d1d1f] hover:bg-black/[0.04] data-[active]:bg-[#1d1d1f] data-[active]:text-white aria-selected:bg-[#1d1d1f] aria-selected:text-white data-selected:bg-[#1d1d1f] data-selected:text-white"
              >
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* 账号设置 */}
          <TabsContent value="account">
            <Card className="bg-white dark:bg-[#1d1d1f] rounded-2xl overflow-hidden">
              <div className="px-6 py-5 border-b border-black/[0.06] dark:border-white/08">
                <h2 className="text-[21px] font-bold tracking-[0.231px] leading-[1.19] text-[#1d1d1f] dark:text-white">
                  账号信息
                </h2>
                <p className="text-[14px] tracking-[-0.224px] text-[rgba(0,0,0,0.48)] dark:text-white/48 mt-1">
                  管理你的个人信息和登录方式
                </p>
              </div>
              <div className="p-6 space-y-5">
                <div className="space-y-2">
                  <Label className="text-[14px] font-medium tracking-[-0.224px] text-[#1d1d1f] dark:text-white/80">
                    昵称
                  </Label>
                  <Input
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[14px] font-medium tracking-[-0.224px] text-[#1d1d1f] dark:text-white/80">
                    邮箱
                  </Label>
                  <Input
                    value={session?.user?.email ?? ""}
                    disabled
                    className="h-11 opacity-50"
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between py-1">
                  <div>
                    <p className="text-[15px] font-semibold tracking-[-0.224px] text-[#1d1d1f] dark:text-white">
                      微信绑定
                    </p>
                    <p className="text-[13px] tracking-[-0.224px] text-[rgba(0,0,0,0.48)] dark:text-white/48 mt-0.5">
                      关联微信后可快速登录
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="#07C160">
                      <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.44 24 16.685 24 14.979c0-3.21-2.931-5.837-6.656-6.088V8.87c-.135-.003-.27-.012-.406-.012zm-2.53 3.274c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.969-.982z" />
                    </svg>
                    绑定微信
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* 订阅管理 */}
          <TabsContent value="subscription">
            <Card className="bg-white dark:bg-[#1d1d1f] rounded-2xl overflow-hidden">
              <div className="px-6 py-5 border-b border-black/[0.06] dark:border-white/08">
                <h2 className="text-[21px] font-bold tracking-[0.231px] leading-[1.19] text-[#1d1d1f] dark:text-white">
                  我的订阅
                </h2>
                <p className="text-[14px] tracking-[-0.224px] text-[rgba(0,0,0,0.48)] dark:text-white/48 mt-1">
                  查看和管理你的订阅计划
                </p>
              </div>
              <div className="p-6 space-y-6">
                {justSubscribed && (
                  <div className="rounded-xl bg-[#34c759]/8 border border-[#34c759]/20 p-4 flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-[#34c759] shrink-0" />
                    <div>
                      <p className="text-[14px] font-semibold text-[#34c759]">订阅成功！</p>
                      <p className="text-[13px] text-[rgba(0,0,0,0.48)] mt-0.5">
                        欢迎使用 WeWrite Pro，全部功能已解锁。
                      </p>
                    </div>
                  </div>
                )}

                {sub?.isActive ? (
                  <>
                    {/* Pro 状态 */}
                    <div className="flex items-center justify-between p-5 rounded-xl bg-[#1d1d1f]">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#0071e3] rounded-2xl flex items-center justify-center">
                          <Zap className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-[18px] font-bold text-white">WeWrite Pro</p>
                            <Badge className="bg-[#34c759] text-white border-0 text-[11px]">
                              有效中
                            </Badge>
                          </div>
                          <p className="text-[13px] text-white/50 mt-0.5">
                            {sub.endsAt
                              ? `到期时间：${new Date(sub.endsAt).toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" })}`
                              : "订阅有效"}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-white/15 text-white hover:bg-white/8 h-9"
                        onClick={handleOpenPortal}
                        disabled={portalLoading}
                      >
                        {portalLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CreditCard className="h-4 w-4" />
                        )}
                        {portalLoading ? "跳转中..." : "管理订阅"}
                      </Button>
                    </div>
                    {/* Pro 功能列表 */}
                    <div className="space-y-2">
                      <p className="text-[14px] font-medium text-[rgba(0,0,0,0.48)]">已解锁功能</p>
                      {[
                        "AI 封面图生成（20张/月）",
                        "SEO 深度分析",
                        "微信草稿箱一键发布",
                        "批量文章生成（10篇/批次）",
                        "阅读数据复盘",
                        "优先 AI 处理队列",
                      ].map((f) => (
                        <div key={f} className="flex items-center gap-2.5 py-1.5">
                          <CheckCircle2 className="h-4 w-4 text-[#34c759]" />
                          <span className="text-[14px] text-[#1d1d1f]">{f}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    {/* Free 状态 */}
                    <div className="flex items-center gap-4 p-5 rounded-xl border border-[rgba(0,0,0,0.08)]">
                      <div className="w-12 h-12 bg-[rgba(0,0,0,0.05)] rounded-2xl flex items-center justify-center">
                        <Zap className="h-6 w-6 text-[rgba(0,0,0,0.24)]" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[18px] font-bold text-[#1d1d1f]">免费版</p>
                        <p className="text-[13px] text-[rgba(0,0,0,0.48)] mt-0.5">
                          热点挖掘、AI 写作、Humanizer
                        </p>
                      </div>
                    </div>

                    {/* 升级提示 */}
                    <div className="rounded-xl bg-gradient-to-br from-[#0071e3]/5 to-[#0071e3]/15 border border-[#0071e3]/20 p-5">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-[#0071e3]/10 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                          <Zap className="h-4 w-4 text-[#0071e3]" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[15px] font-bold text-[#1d1d1f]">升级到 Pro</p>
                          <p className="text-[13px] text-[rgba(0,0,0,0.48)] mt-1 leading-relaxed">
                            ¥99/月，解锁封面图、SEO、微信发布、数据复盘等全部高级功能
                          </p>
                        </div>
                      </div>
                      <Link href="/pricing" className="mt-4 block">
                        <Button variant="pill-filled" size="pill-sm" className="w-full gap-1.5">
                          <ExternalLink className="h-3.5 w-3.5" />
                          查看定价方案
                        </Button>
                      </Link>
                    </div>
                  </>
                )}
                {subscriptionError && (
                  <StepStatusAlert
                    variant="error"
                    title="订阅中心暂不可用"
                    description={subscriptionError}
                  />
                )}
              </div>
            </Card>
          </TabsContent>

          {/* AI 设置 */}
          <TabsContent value="ai">
            <Card className="bg-white dark:bg-[#1d1d1f] rounded-2xl overflow-hidden">
              <div className="px-6 py-5 border-b border-black/[0.06] dark:border-white/08">
                <h2 className="text-[21px] font-bold tracking-[0.231px] leading-[1.19] text-[#1d1d1f] dark:text-white">
                  AI 配置
                </h2>
                <p className="text-[14px] tracking-[-0.224px] text-[rgba(0,0,0,0.48)] dark:text-white/48 mt-1">
                  选择 AI 提供商，平台统一托管 API Key 与服务端点
                </p>
              </div>
              <div className="p-6 space-y-6">

                {/* AI 提供商 */}
                <div className="space-y-3">
                  <Label className="text-[14px] font-medium tracking-[-0.224px] text-[#1d1d1f] dark:text-white/80">
                    AI 提供商
                  </Label>
                  <div className="flex gap-3">
                    {AI_PROVIDERS.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => handleProviderChange(p.id)}
                        className={cn(
                          "flex items-center gap-2.5 px-5 py-3 rounded-xl border text-[14px] font-medium transition-all",
                          aiProvider === p.id
                            ? `${p.bg} ${p.border} border-2`
                            : "border-black/[0.08] dark:border-white/10 hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
                        )}
                        style={{
                          color: aiProvider === p.id ? p.color : undefined,
                        }}
                      >
                        {p.name}
                        {aiProvider === p.id && (
                          <CheckCircle2 className="h-4 w-4 ml-1" style={{ color: p.color }} />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <Label className="text-[14px] font-medium tracking-[-0.224px] text-[#1d1d1f] dark:text-white/80">
                      模型
                    </Label>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5 border-[rgba(0,0,0,0.08)] text-[12px]"
                      onClick={() => void loadModelOptions(aiProvider, aiModel, modelTier)}
                      disabled={modelLoading}
                    >
                      {modelLoading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <RefreshCcw className="h-3.5 w-3.5" />
                      )}
                      {modelLoading ? "拉取中..." : "刷新模型"}
                    </Button>
                  </div>

                  <Input
                    value={aiModel}
                    onChange={(e) => setAiModel(e.target.value)}
                    placeholder={
                      isProTier
                        ? "输入模型名，例如 gpt-4.1 / claude-sonnet-4-7-20250514"
                        : "免费版仅支持基础模型，请从下方选择"
                    }
                    className="h-10"
                    disabled={!isProTier}
                  />

                  {modelOptions.length > 0 && (
                    <div className="space-y-3">
                      {(["openai", "anthropic", "other"] as const).map((vendor) => {
                        const vendorModels = modelVendorGroups[vendor];
                        if (vendorModels.length === 0) return null;

                        return (
                          <div key={vendor} className="space-y-2">
                            <p className="text-[11px] font-medium tracking-[0.06em] text-[rgba(0,0,0,0.4)]">
                              {MODEL_VENDOR_LABELS[vendor]}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {vendorModels.map((model) => (
                                <button
                                  key={model}
                                  onClick={() => setAiModel(model)}
                                  className={cn(
                                    "rounded-full border px-3 py-1.5 text-[12px] transition-all",
                                    aiModel === model
                                      ? "border-[#0071e3]/35 bg-[#0071e3]/10 text-[#0071e3]"
                                      : "border-black/[0.08] text-[rgba(0,0,0,0.68)] hover:bg-black/[0.02]"
                                  )}
                                >
                                  {model}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <p className="text-[12px] tracking-[-0.12px] text-[rgba(0,0,0,0.45)]">
                    {modelSource === "remote"
                      ? "已从当前服务端代理自动拉取模型列表。"
                      : isProTier
                        ? "模型列表拉取失败；你仍可手动输入模型名。"
                        : "模型列表拉取失败；免费版将自动回退到基础模型。"}
                    {!isProTier ? "当前套餐仅支持基础模型（mini / nano / haiku）。" : ""}
                    {modelError ? `（${modelError}）` : ""}
                  </p>
                </div>

                <div className="rounded-xl border border-[#0071e3]/20 bg-[#0071e3]/6 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[14px] font-semibold tracking-[-0.224px] text-[#1d1d1f]">
                        平台托管模式
                      </p>
                      <p className="mt-1 text-[12px] tracking-[-0.12px] text-[rgba(0,0,0,0.48)]">
                        用户侧不再保存 API Key，也不可配置代理端点。所有调用统一走平台服务端配置。
                      </p>
                    </div>
                    <Badge
                      variant={aiProviderReady ? "default" : "outline"}
                      className={cn(
                        "shrink-0",
                        aiProviderReady
                          ? "bg-[#34c759]/10 text-[#34c759] border-0"
                          : "border-[#ff3b30]/30 bg-[#ff3b30]/8 text-[#ff3b30]"
                      )}
                    >
                      {aiProviderReady ? "服务可用" : "服务未就绪"}
                    </Badge>
                  </div>
                </div>

                {/* 测试连接 */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[14px] font-medium tracking-[-0.224px] text-[#1d1d1f] dark:text-white/80">
                        连接测试
                      </p>
                      <p className="text-[12px] tracking-[-0.12px] text-[rgba(0,0,0,0.32)] dark:text-white/32">
                        点击检测 AI 接口是否正常响应
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 h-9 border-[rgba(0,0,0,0.08)] text-[14px]"
                      onClick={handleTestConnection}
                      disabled={testing}
                    >
                      {testing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Wifi className="h-4 w-4" />
                      )}
                      {testing ? "测试中..." : "测试连接"}
                    </Button>
                  </div>

                  {/* 测试结果 */}
                  {testResult && (
                    <div
                      className={cn(
                        "rounded-xl p-4 flex items-start gap-3",
                        testResult.ok
                          ? "bg-[#34c759]/8 border border-[#34c759]/20"
                          : "bg-[#ff3b30]/8 border border-[#ff3b30]/20"
                      )}
                    >
                      {testResult.ok ? (
                        <CheckCircle2 className="h-5 w-5 text-[#34c759] shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="h-5 w-5 text-[#ff3b30] shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            "text-[14px] font-semibold tracking-[-0.224px]",
                            testResult.ok ? "text-[#34c759]" : "text-[#ff3b30]"
                          )}
                        >
                          {testResult.ok
                            ? `连接成功（${testResult.latency}）`
                            : "连接失败"}
                        </p>
                        {testResult.ok ? (
                          <p className="text-[12px] text-[rgba(0,0,0,0.48)] dark:text-white/48 mt-0.5">
                            {selectedProvider.name} · {testResult.baseUrl}
                            {testResult.model && (
                              <span className="ml-2 text-[rgba(0,0,0,0.68)]">
                                模型：{testResult.model}
                              </span>
                            )}
                            {testResult.reply && (
                              <span className="ml-2 font-mono text-[#34c759]">
                                → &quot;{testResult.reply}&quot;
                              </span>
                            )}
                          </p>
                        ) : (
                          <p className="text-[12px] text-[rgba(0,0,0,0.48)] dark:text-white/48 mt-0.5 break-all">
                            {testResult.error}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Humanizer */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[15px] font-semibold tracking-[-0.224px] text-[#1d1d1f] dark:text-white">
                        Humanizer 去 AI 化
                      </p>
                      <p className="text-[13px] tracking-[-0.224px] text-[rgba(0,0,0,0.48)] dark:text-white/48 mt-0.5">
                        自动检测并修复 AI 写作痕迹
                      </p>
                    </div>
                    <Switch
                      checked={humanizerEnabled}
                      onCheckedChange={setHumanizerEnabled}
                    />
                  </div>

                  {humanizerEnabled && (
                    <div className="space-y-3">
                      <Label className="text-[14px] font-medium tracking-[-0.224px] text-[#1d1d1f] dark:text-white/80">
                        严格度
                      </Label>
                      <div className="flex gap-2 flex-wrap">
                        {HUMANIZER_LEVELS.map((level) => (
                          <button
                            key={level.id}
                            onClick={() => setHumanizerStrict(level.id)}
                            className={cn(
                              "px-4 py-2 rounded-xl border text-[13px] font-medium transition-all",
                              humanizerStrict === level.id
                                ? "bg-[#0071e3]/10 border-[#0071e3]/30 text-[#0071e3]"
                                : "border-black/[0.08] dark:border-white/10 text-[#1d1d1f] dark:text-white/80 hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
                            )}
                          >
                            {level.label}
                          </button>
                        ))}
                      </div>
                      <p className="text-[13px] tracking-[-0.224px] text-[rgba(0,0,0,0.32)] dark:text-white/32">
                        {HUMANIZER_LEVELS.find((l) => l.id === humanizerStrict)?.desc}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* 风格设置 */}
          <TabsContent value="style">
            <Card className="bg-white dark:bg-[#1d1d1f] rounded-2xl overflow-hidden">
              <div className="px-6 py-5 border-b border-black/[0.06] dark:border-white/08">
                <h2 className="text-[21px] font-bold tracking-[0.231px] leading-[1.19] text-[#1d1d1f] dark:text-white">
                  写作人格
                </h2>
                <p className="text-[14px] tracking-[-0.224px] text-[rgba(0,0,0,0.48)] dark:text-white/48 mt-1">
                  选择你的主要写作风格，不同人格会影响 AI 输出的语气和结构
                </p>
              </div>
              <div className="p-6 space-y-2">
                {PERSONAS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPersona(p.id)}
                    className={cn(
                      "w-full text-left p-4 rounded-xl transition-all",
                      persona === p.id
                        ? "bg-[#f5f5f7] dark:bg-white/5 border-2 border-[#0071e3]"
                        : "border border-transparent hover:bg-[#f5f5f7] dark:hover:bg-white/[0.03]"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-[28px] leading-none">{p.emoji}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[15px] font-semibold tracking-[-0.224px] text-[#1d1d1f] dark:text-white">
                            {p.name}
                          </span>
                          {persona === p.id && (
                            <CheckCircle2 className="h-4 w-4 text-[#0071e3]" />
                          )}
                        </div>
                        <p className="text-[13px] tracking-[-0.224px] text-[rgba(0,0,0,0.48)] dark:text-white/48 mt-0.5">
                          {p.desc}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* 微信设置 */}
          <TabsContent value="wechat">
            <Card className="bg-white dark:bg-[#1d1d1f] rounded-2xl overflow-hidden">
              <div className="px-6 py-5 border-b border-black/[0.06] dark:border-white/08">
                <h2 className="text-[21px] font-bold tracking-[0.231px] leading-[1.19] text-[#1d1d1f] dark:text-white">
                  微信公众号
                </h2>
                <p className="text-[14px] tracking-[-0.224px] text-[rgba(0,0,0,0.48)] dark:text-white/48 mt-1">
                  填入公众号凭证后可将文章直接推送到草稿箱
                </p>
              </div>
              <div className="p-6 space-y-5">
                <div className="rounded-xl bg-[#ff9500]/8 border border-[#ff9500]/20 p-4">
                  <p className="text-[13px] text-[#1d1d1f] dark:text-white">
                    凭证仅在服务端加密存储，不会暴露在前端或日志中
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-[14px] font-medium tracking-[-0.224px] text-[#1d1d1f] dark:text-white/80">
                    AppID
                  </Label>
                  <Input placeholder="wx..." className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[14px] font-medium tracking-[-0.224px] text-[#1d1d1f] dark:text-white/80">
                    AppSecret
                  </Label>
                  <Input type="password" placeholder="••••••••" className="h-11" />
                </div>
                <Button variant="pill-outline" size="pill-sm">
                  保存凭证
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* 保存按钮 */}
        <div className="mt-6 hidden items-center gap-3 pt-2 sm:flex">
          <Button
            variant="pill-filled"
            size="pill-sm"
            onClick={handleSave}
            disabled={saving}
            className="gap-2 h-11 px-6 text-[15px]"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? "保存中..." : "保存设置"}
          </Button>
          {saved && (
            <span className="flex items-center gap-1.5 text-[14px] text-[#34c759] font-medium">
              <CheckCircle2 className="h-4 w-4" />
              已保存
            </span>
          )}
          {saveError && (
            <span className="text-[13px] text-[#ff3b30]">{saveError}</span>
          )}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-black/[0.08] bg-white/95 px-4 py-3 backdrop-blur-md sm:hidden">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-2">
          {saveError && (
            <p className="text-[12px] text-[#ff3b30]">{saveError}</p>
          )}
          <div className="flex items-center justify-between gap-3">
            <p className="text-[12px] tracking-[-0.1px] text-[rgba(0,0,0,0.5)]">
              当前标签：{[
                { value: "account", label: "账号" },
                { value: "subscription", label: "订阅" },
                { value: "ai", label: "AI" },
                { value: "style", label: "风格" },
                { value: "wechat", label: "微信" },
              ].find((tab) => tab.value === activeTab)?.label ?? activeTab}
            </p>
            <Button
              variant="pill-filled"
              size="sm"
              onClick={handleSave}
              disabled={saving}
              className="h-9 gap-1.5 px-4 text-[13px]"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? "保存中" : "保存"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
