"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Save, Key, User, MessageSquare, BookOpen, CheckCircle2, Loader2 } from "lucide-react";

const PERSONAS = [
  { id: "midnight-friend", name: "深夜朋友", desc: "第一人称，极口语化，像在和读者聊天", emoji: "🌙" },
  { id: "warm-editor", name: "温暖编辑", desc: "叙事温暖，故事嵌套数据", emoji: "🌸" },
  { id: "industry-observer", name: "行业观察者", desc: "中性分析，数据驱动", emoji: "🔍" },
  { id: "sharp-journalist", name: "锐利记者", desc: "观点鲜明，数据支撑", emoji: "⚡" },
  { id: "cold-analyst", name: "冷静分析师", desc: "克制严谨，逻辑严密", emoji: "❄️" },
];

export default function SettingsPage() {
  const { data: session } = useSession();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // 风格配置状态
  const [nickname, setNickname] = useState(session?.user?.name ?? "");
  const [persona, setPersona] = useState("midnight-friend");
  const [aiProvider, setAiProvider] = useState("anthropic");
  const [humanizerEnabled, setHumanizerEnabled] = useState(true);
  const [humanizerStrict, setHumanizerStrict] = useState<"relaxed" | "standard" | "strict">("standard");

  const handleSave = async () => {
    setSaving(true);
    // 模拟保存
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight">设置</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          配置你的 AI 写作偏好，所有设置实时保存
        </p>
      </div>

      <Tabs defaultValue="account" className="space-y-4">
        <TabsList className="grid grid-cols-4 w-fit">
          <TabsTrigger value="account" className="gap-1.5 text-[12px]">
            <User className="h-3.5 w-3.5" />
            账号
          </TabsTrigger>
          <TabsTrigger value="ai" className="gap-1.5 text-[12px]">
            <Key className="h-3.5 w-3.5" />
            AI
          </TabsTrigger>
          <TabsTrigger value="style" className="gap-1.5 text-[12px]">
            <MessageSquare className="h-3.5 w-3.5" />
            风格
          </TabsTrigger>
          <TabsTrigger value="wechat" className="gap-1.5 text-[12px]">
            <BookOpen className="h-3.5 w-3.5" />
            微信
          </TabsTrigger>
        </TabsList>

        {/* 账号设置 */}
        <TabsContent value="account">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-[15px]">账号信息</CardTitle>
              <CardDescription className="text-[12px]">
                管理你的个人信息和登录方式
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[12px]">昵称</Label>
                <Input
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="text-[13px]"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[12px]">邮箱</Label>
                <Input value={session?.user?.email ?? ""} disabled className="text-[13px]" />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[13px] font-medium">微信绑定</p>
                  <p className="text-[11px] text-muted-foreground">关联微信后可快速登录</p>
                </div>
                <Button variant="outline" size="sm" className="text-[12px] gap-1.5">
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="#07C160"><path d="M8.691 2.188C3.891 2.188..."/></svg>
                  绑定微信
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI 设置 */}
        <TabsContent value="ai">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-[15px]">AI 配置</CardTitle>
              <CardDescription className="text-[12px]">
                选择 AI 提供商并配置 API Key（Key 仅在服务端使用，不会暴露）
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[12px]">AI 提供商</Label>
                <div className="flex gap-2">
                  {[
                    { id: "anthropic", name: "Claude", color: "bg-orange-500/10 border-orange-200 text-orange-600" },
                    { id: "openai", name: "GPT-4", color: "bg-green-500/10 border-green-200 text-green-600" },
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setAiProvider(p.id)}
                      className={cn(
                        "px-4 py-2 rounded-lg border text-[13px] font-medium transition-all",
                        aiProvider === p.id
                          ? `${p.color} border-2`
                          : "border-border hover:bg-muted"
                      )}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[12px]">API Key（可选，使用自己的 Key）</Label>
                <Input
                  type="password"
                  placeholder={aiProvider === "anthropic" ? "sk-ant-..." : "sk-..."}
                  className="text-[13px]"
                />
                <p className="text-[11px] text-muted-foreground">
                  若不填，系统将使用默认 AI 服务
                </p>
              </div>

              <Separator />

              {/* Humanizer 配置 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[13px] font-medium">Humanizer 去 AI 化</p>
                    <p className="text-[11px] text-muted-foreground">自动检测并修复 AI 写作痕迹</p>
                  </div>
                  <Switch checked={humanizerEnabled} onCheckedChange={setHumanizerEnabled} />
                </div>

                {humanizerEnabled && (
                  <div className="space-y-2">
                    <Label className="text-[12px]">严格度</Label>
                    <div className="flex gap-2">
                      {(["relaxed", "standard", "strict"] as const).map((level) => (
                        <button
                          key={level}
                          onClick={() => setHumanizerStrict(level)}
                          className={cn(
                            "px-3 py-1.5 rounded-lg border text-[12px] transition-all",
                            humanizerStrict === level
                              ? "bg-blue-50 border-blue-200 text-blue-600"
                              : "border-border hover:bg-muted"
                          )}
                        >
                          {level === "relaxed" ? "宽松" : level === "standard" ? "标准" : "严格"}
                        </button>
                      ))}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {humanizerStrict === "relaxed"
                        ? "仅修复高置信度命中（7+ 条规则同时触发）"
                        : humanizerStrict === "standard"
                        ? "修复所有命中规则（推荐）"
                        : "标准模式 + 反 AI 审计二次修复"}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 风格设置 */}
        <TabsContent value="style">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-[15px]">写作人格</CardTitle>
              <CardDescription className="text-[12px]">
                选择你的主要写作风格，不同人格会影响 AI 输出的语气和结构
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {PERSONAS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPersona(p.id)}
                  className={cn(
                    "w-full text-left p-4 rounded-lg border transition-all",
                    persona === p.id
                      ? "border-blue-200 bg-blue-50 ring-2 ring-blue-100"
                      : "border-border hover:bg-muted/50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{p.emoji}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[14px] font-semibold">{p.name}</span>
                        {persona === p.id && (
                          <CheckCircle2 className="h-4 w-4 text-blue-500" />
                        )}
                      </div>
                      <p className="text-[12px] text-muted-foreground mt-0.5">{p.desc}</p>
                    </div>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 微信设置 */}
        <TabsContent value="wechat">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-[15px]">微信公众号</CardTitle>
              <CardDescription className="text-[12px]">
                填入公众号凭证后可将文章直接推送到草稿箱
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-[12px] text-amber-700">
                  ⚠️ 凭证仅在服务端加密存储，不会暴露在前端或日志中
                </p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[12px]">AppID</Label>
                <Input placeholder="wx..." className="text-[13px]" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[12px]">AppSecret</Label>
                <Input type="password" placeholder="••••••••" className="text-[13px]" />
              </div>
              <Button variant="outline" size="sm" className="text-[12px]">
                保存凭证
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 保存按钮 */}
      <div className="flex items-center gap-3 pt-2">
        <Button
          className="gap-1.5 bg-blue-500 hover:bg-blue-600"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "保存中..." : "保存设置"}
        </Button>
        {saved && (
          <span className="flex items-center gap-1 text-[13px] text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            已保存
          </span>
        )}
      </div>
    </div>
  );
}
