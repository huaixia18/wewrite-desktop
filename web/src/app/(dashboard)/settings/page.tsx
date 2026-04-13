"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  Save,
  Key,
  User,
  MessageSquare,
  BookOpen,
  CheckCircle2,
  Loader2,
  Sparkles,
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

export default function SettingsPage() {
  const { data: session } = useSession();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // 风格配置状态
  const [nickname, setNickname] = useState(session?.user?.name ?? "");
  const [persona, setPersona] = useState("midnight-friend");
  const [aiProvider, setAiProvider] = useState("anthropic");
  const [humanizerEnabled, setHumanizerEnabled] = useState(true);
  const [humanizerStrict, setHumanizerStrict] = useState<
    "relaxed" | "standard" | "strict"
  >("standard");

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      {/* ── Page Header ── */}
      <div className="bg-black text-white px-8 py-10">
        <div className="max-w-3xl mx-auto">
          <h1
            className="text-[40px] font-semibold tracking-[-0.28px] leading-[1.1] text-white"
            style={{ letterSpacing: "-0.28px" }}
          >
            设置
          </h1>
          <p
            className="text-[17px] font-normal tracking-[-0.374px] leading-[1.47] text-white/60 mt-2"
          >
            配置你的 AI 写作偏好
          </p>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-3xl mx-auto px-8 py-8">
        <Tabs defaultValue="account" className="space-y-6">
          {/* Apple-style horizontal pill tabs */}
          <TabsList
            variant="default"
            className="bg-transparent p-0 gap-1 mb-2"
          >
            {[
              { value: "account", label: "账号", icon: User },
              { value: "ai", label: "AI", icon: Key },
              { value: "style", label: "风格", icon: MessageSquare },
              { value: "wechat", label: "微信", icon: BookOpen },
            ].map(({ value, label, icon: Icon }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="data-selected:bg-[#1d1d1f] data-selected:text-white data-selected:shadow-none rounded-full"
                style={{
                  background: "transparent",
                  padding: "7px 18px",
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "#1d1d1f",
                }}
              >
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* 账号设置 */}
          <TabsContent value="account">
            <Card className="bg-white dark:bg-[#1d1d1f] rounded-2xl overflow-hidden">
              <div className="px-6 py-5 border-b border-black/[0.06] dark:border-white/08">
                <h2
                  className="text-[21px] font-bold tracking-[0.231px] leading-[1.19] text-[#1d1d1f] dark:text-white"
                >
                  账号信息
                </h2>
                <p
                  className="text-[14px] tracking-[-0.224px] text-[rgba(0,0,0,0.48)] dark:text-white/48 mt-1"
                >
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
                    <svg
                      className="h-3.5 w-3.5"
                      viewBox="0 0 24 24"
                      fill="#07C160"
                    >
                      <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.44 24 16.685 24 14.979c0-3.21-2.931-5.837-6.656-6.088V8.87c-.135-.003-.27-.012-.406-.012zm-2.53 3.274c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.969-.982z" />
                    </svg>
                    绑定微信
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* AI 设置 */}
          <TabsContent value="ai">
            <Card className="bg-white dark:bg-[#1d1d1f] rounded-2xl overflow-hidden">
              <div className="px-6 py-5 border-b border-black/[0.06] dark:border-white/08">
                <h2
                  className="text-[21px] font-bold tracking-[0.231px] leading-[1.19] text-[#1d1d1f] dark:text-white"
                >
                  AI 配置
                </h2>
                <p
                  className="text-[14px] tracking-[-0.224px] text-[rgba(0,0,0,0.48)] dark:text-white/48 mt-1"
                >
                  选择 AI 提供商并配置 API Key
                </p>
              </div>
              <div className="p-6 space-y-6">
                {/* AI 提供商选择 */}
                <div className="space-y-3">
                  <Label className="text-[14px] font-medium tracking-[-0.224px] text-[#1d1d1f] dark:text-white/80">
                    AI 提供商
                  </Label>
                  <div className="flex gap-3">
                    {AI_PROVIDERS.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setAiProvider(p.id)}
                        className={cn(
                          "flex items-center gap-2.5 px-5 py-3 rounded-xl border text-[14px] font-medium transition-all",
                          aiProvider === p.id
                            ? `${p.bg} ${p.border} border-2 text-[${p.color}]`
                            : "border-black/[0.08] dark:border-white/10 hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
                        )}
                        style={{
                          color:
                            aiProvider === p.id ? p.color : undefined,
                        }}
                      >
                        {p.name}
                        {aiProvider === p.id && (
                          <CheckCircle2
                            className="h-4 w-4 ml-1"
                            style={{ color: p.color }}
                          />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[14px] font-medium tracking-[-0.224px] text-[#1d1d1f] dark:text-white/80">
                    API Key（可选）
                  </Label>
                  <Input
                    type="password"
                    placeholder={
                      aiProvider === "anthropic" ? "sk-ant-..." : "sk-..."
                    }
                    className="h-11"
                  />
                  <p className="text-[13px] tracking-[-0.224px] text-[rgba(0,0,0,0.32)] dark:text-white/32">
                    若不填，系统将使用默认 AI 服务
                  </p>
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
                        {HUMANIZER_LEVELS.find((l) => l.id === humanizerStrict)
                          ?.desc ?? ""}
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
                <h2
                  className="text-[21px] font-bold tracking-[0.231px] leading-[1.19] text-[#1d1d1f] dark:text-white"
                >
                  写作人格
                </h2>
                <p
                  className="text-[14px] tracking-[-0.224px] text-[rgba(0,0,0,0.48)] dark:text-white/48 mt-1"
                >
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
                <h2
                  className="text-[21px] font-bold tracking-[0.231px] leading-[1.19] text-[#1d1d1f] dark:text-white"
                >
                  微信公众号
                </h2>
                <p
                  className="text-[14px] tracking-[-0.224px] text-[rgba(0,0,0,0.48)] dark:text-white/48 mt-1"
                >
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
        <div className="flex items-center gap-3 mt-6 pt-2">
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
        </div>
      </div>
    </div>
  );
}
