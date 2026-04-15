"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ArrowRight, Lock, Mail, Sparkles, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const productHighlights = [
  "热点抓取、选题分析、框架选择保持在同一条工作流里。",
  "写作、去 AI 化、SEO 与封面图都在一个安静的写作空间完成。",
  "历史文章与偏好设置同步收口，减少来回切页的干扰。",
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState<"login" | "register" | null>(null);
  const [error, setError] = useState("");

  const handleEmailLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading("login");
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("邮箱或密码错误");
      setLoading(null);
      return;
    }

    router.push("/write");
  };

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!email || !password || !nickname) {
      setError("请完整填写昵称、邮箱和密码");
      return;
    }

    setLoading("register");
    setError("");

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, nickname }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "注册失败");
        setLoading(null);
        return;
      }

      await signIn("credentials", { email, password, redirect: false });
      router.push("/write");
    } catch {
      setError("注册失败，请稍后再试");
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(420px,0.9fr)]">
      <section className="bg-black px-6 py-10 text-white sm:px-10 lg:flex lg:min-h-screen lg:flex-col lg:justify-between lg:px-12 lg:py-12">
        <div>
          <div className="apple-kicker border border-white/[0.08] bg-white/[0.04] text-white/68">
            <Sparkles className="h-3.5 w-3.5 text-[#0071e3]" />
            WeWrite
          </div>
          <h1 className="mt-6 max-w-[10ch] text-white">
            让公众号写作像在一个安静的编辑部里完成。
          </h1>
          <p className="mt-4 max-w-[560px] text-[17px] leading-[1.47] tracking-[-0.374px] text-white/62">
            从热点到发布，所有关键动作都收口在一块连续的界面里。登录后你会直接进入重构后的写作中心。
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-3 lg:mt-0 lg:max-w-[820px]">
          {productHighlights.map((item, index) => (
            <div
              key={item}
              className="rounded-[24px] border border-white/[0.08] bg-white/[0.04] p-5"
            >
              <p className="text-[12px] tracking-[-0.12px] text-white/42">
                0{index + 1}
              </p>
              <p className="mt-3 text-[15px] leading-[1.5] tracking-[-0.224px] text-white/72">
                {item}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="flex px-6 py-10 sm:px-10 lg:min-h-screen lg:items-center lg:px-12">
        <div className="mx-auto w-full max-w-[460px]">
          <div className="rounded-[32px] bg-white p-6 shadow-[rgba(0,0,0,0.14)_0_24px_48px_-28px] sm:p-8">
            <div className="mb-8">
              <p className="text-[12px] uppercase tracking-[0.08em] text-[rgba(0,0,0,0.38)]">
                Account
              </p>
              <h2 className="mt-3 text-[40px] font-semibold leading-[1.1] tracking-[-0.28px] text-[#1d1d1f]">
                登录或创建账号
              </h2>
              <p className="mt-3 text-[14px] leading-[1.5] tracking-[-0.224px] text-[rgba(0,0,0,0.48)]">
                使用邮箱继续，进入完整的 AI 写作流程。
              </p>
            </div>

            <Tabs defaultValue="login" className="flex flex-col gap-6">
              <TabsList variant="default" className="w-fit bg-[#ececf1] p-1">
                <TabsTrigger value="login">登录</TabsTrigger>
                <TabsTrigger value="register">注册</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="mt-0">
                <form className="space-y-4" onSubmit={handleEmailLogin}>
                  <div className="space-y-2">
                    <Label htmlFor="login-email">邮箱</Label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[rgba(0,0,0,0.28)]" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="you@example.com"
                        className="h-12 rounded-[16px] bg-[#fafafc] pl-11"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">密码</Label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[rgba(0,0,0,0.28)]" />
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="输入密码"
                        className="h-12 rounded-[16px] bg-[#fafafc] pl-11"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {error && (
                    <p className="text-[13px] tracking-[-0.224px] text-[#d92b20]">{error}</p>
                  )}

                  <Button
                    type="submit"
                    variant="pill-filled"
                    className="h-11 w-full gap-2 text-[14px]"
                    disabled={loading !== null}
                  >
                    {loading === "login" ? "登录中..." : "登录进入写作中心"}
                    {loading !== "login" && <ArrowRight className="h-4 w-4" />}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register" className="mt-0">
                <form className="space-y-4" onSubmit={handleRegister}>
                  <div className="space-y-2">
                    <Label htmlFor="register-name">昵称</Label>
                    <div className="relative">
                      <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[rgba(0,0,0,0.28)]" />
                      <Input
                        id="register-name"
                        placeholder="你的名字"
                        className="h-12 rounded-[16px] bg-[#fafafc] pl-11"
                        value={nickname}
                        onChange={(event) => setNickname(event.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-email">邮箱</Label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[rgba(0,0,0,0.28)]" />
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="you@example.com"
                        className="h-12 rounded-[16px] bg-[#fafafc] pl-11"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-password">密码</Label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[rgba(0,0,0,0.28)]" />
                      <Input
                        id="register-password"
                        type="password"
                        placeholder="至少 6 位"
                        className="h-12 rounded-[16px] bg-[#fafafc] pl-11"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        minLength={6}
                        required
                      />
                    </div>
                  </div>

                  {error && (
                    <p className="text-[13px] tracking-[-0.224px] text-[#d92b20]">{error}</p>
                  )}

                  <Button
                    type="submit"
                    variant="pill-filled"
                    className="h-11 w-full gap-2 text-[14px]"
                    disabled={loading !== null}
                  >
                    {loading === "register" ? "注册中..." : "注册并开始写作"}
                    {loading !== "register" && <ArrowRight className="h-4 w-4" />}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </div>

          <p className="mt-6 text-[12px] leading-[1.5] tracking-[-0.12px] text-[rgba(0,0,0,0.42)]">
            继续即表示你同意
            {" "}
            <Link href="/terms" className="text-[#0066cc] hover:underline">
              服务条款
            </Link>
            {" "}
            与
            {" "}
            <Link href="/privacy" className="text-[#0066cc] hover:underline">
              隐私政策
            </Link>
            。
          </p>
        </div>
      </section>
    </div>
  );
}
