"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Sparkles, Mail, Lock, User, ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/* ─── Apple Login Page ─────────────────────────────────────────────────
 * Full-bleed alternating sections: black hero → light body → black footer
 * Pure Apple Design System: #0071e3 accent, #000/#f5f5f7 backgrounds
 * SF Pro typography, 980px pill CTAs
 */
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("邮箱或密码错误");
      setLoading(false);
    } else {
      router.push("/write");
    }
  };

  const handleWechatLogin = () => {
    signIn("wechat", { callbackUrl: "/write" });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !nickname) {
      setError("请填写所有字段");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, nickname }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "注册失败");
        setLoading(false);
        return;
      }

      await signIn("credentials", { email, password, redirect: false });
      router.push("/write");
    } catch {
      setError("注册失败，请重试");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      {/* ── Hero Section ── */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-20 relative overflow-hidden">
        {/* Subtle radial glow behind logo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#0071e3]/5 blur-[120px] pointer-events-none" />

        <div className="relative w-full max-w-[400px]">
          {/* Logo mark */}
          <div className="flex flex-col items-center mb-10">
            <div className="w-14 h-14 rounded-[28px] bg-[#0071e3] flex items-center justify-center mb-5">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-[40px] font-semibold tracking-[-0.28px] leading-[1.07] text-white">
              WeWrite
            </h1>
            <p className="text-[17px] font-normal tracking-[-0.374px] leading-[1.47] text-white/60 mt-1">
              微信公众号 AI 写作助手
            </p>
          </div>

          {/* Auth Card */}
          <div className="bg-white/[0.04] rounded-2xl border border-white/[0.1] backdrop-blur-xl overflow-hidden">
            <Tabs defaultValue="login" className="w-full">
              <TabsList
                variant="default"
                className="w-full justify-start rounded-none border-b border-white/[0.08] bg-transparent p-0"
              >
                <TabsTrigger
                  value="login"
                  className={cn(
                    "flex-1 rounded-none border-b-2 border-transparent data-selected:border-[#0071e3]",
                    "data-selected:text-white text-white/40",
                    "px-4 py-3 text-[15px] font-semibold tracking-[-0.224px]"
                  )}
                >
                  登录
                </TabsTrigger>
                <TabsTrigger
                  value="register"
                  className={cn(
                    "flex-1 rounded-none border-b-2 border-transparent data-selected:border-[#0071e3]",
                    "data-selected:text-white text-white/40",
                    "px-4 py-3 text-[15px] font-semibold tracking-[-0.224px]"
                  )}
                >
                  注册
                </TabsTrigger>
              </TabsList>

              {/* 登录表单 */}
              <TabsContent value="login" className="mt-0">
                <form onSubmit={handleEmailLogin} className="p-6 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[14px] font-medium tracking-[-0.224px] text-white/60">
                      邮箱
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        className="pl-11 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-[#0071e3]"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[14px] font-medium tracking-[-0.224px] text-white/60">
                      密码
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                      <Input
                        type="password"
                        placeholder="••••••••"
                        className="pl-11 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-[#0071e3]"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {error && (
                    <p className="text-[13px] text-[#ff453a]">{error}</p>
                  )}

                  <Button
                    type="submit"
                    variant="pill-filled"
                    size="pill-sm"
                    className="w-full mt-2"
                    disabled={loading}
                  >
                    {loading ? "登录中..." : "登录"}
                    {!loading && <ArrowRight className="h-4 w-4 ml-1" />}
                  </Button>
                </form>

                <div className="px-6 pb-6">
                  <div className="relative">
                    <Separator className="bg-white/10" />
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="bg-[#000] px-3 text-[12px] text-white/30">其他方式</span>
                    </span>
                  </div>

                  {/* 微信登录 */}
                  <Button
                    variant="outline"
                    className="w-full mt-4 h-11 text-[15px] font-normal border-white/20 text-white hover:bg-white/5 hover:text-white"
                    onClick={handleWechatLogin}
                  >
                    <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="#07C160">
                      <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.44 24 16.685 24 14.979c0-3.21-2.931-5.837-6.656-6.088V8.87c-.135-.003-.27-.012-.406-.012zm-2.53 3.274c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.969-.982z" />
                    </svg>
                    微信登录
                  </Button>
                </div>
              </TabsContent>

              {/* 注册表单 */}
              <TabsContent value="register" className="mt-0">
                <form onSubmit={handleRegister} className="p-6 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[14px] font-medium tracking-[-0.224px] text-white/60">
                      昵称
                    </Label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                      <Input
                        placeholder="你的昵称"
                        className="pl-11 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-[#0071e3]"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[14px] font-medium tracking-[-0.224px] text-white/60">
                      邮箱
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        className="pl-11 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-[#0071e3]"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[14px] font-medium tracking-[-0.224px] text-white/60">
                      密码
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                      <Input
                        type="password"
                        placeholder="设置密码（至少 6 位）"
                        className="pl-11 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-[#0071e3]"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        minLength={6}
                        required
                      />
                    </div>
                  </div>

                  {error && (
                    <p className="text-[13px] text-[#ff453a]">{error}</p>
                  )}

                  <Button
                    type="submit"
                    variant="pill-filled"
                    size="pill-sm"
                    className="w-full mt-2"
                    disabled={loading}
                  >
                    {loading ? "注册中..." : "注册"}
                    {!loading && <ArrowRight className="h-4 w-4 ml-1" />}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </div>

          {/* Legal */}
          <p className="text-center text-[12px] text-white/30 mt-6 tracking-[-0.12px]">
            登录即表示同意{" "}
            <Link href="/terms" className="text-white/50 hover:underline">
              服务条款
            </Link>{" "}
            和{" "}
            <Link href="/privacy" className="text-white/50 hover:underline">
              隐私政策
            </Link>
          </p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/[0.06] px-6 py-4">
        <p className="text-center text-[12px] text-white/20 tracking-[-0.12px]">
          © 2026 WeWrite. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
