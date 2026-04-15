import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createAIClient } from "@/lib/ai";

/**
 * GET /api/ai/test
 * 测试 AI 连接是否正常
 *
 * Query params:
 *   provider  — "anthropic" | "openai"（可选）
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const queryProvider = searchParams.get("provider");

  // 平台托管模式：仅允许选择 provider，不接受用户自定义 key/baseUrl
  const userConfig = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { aiProvider: true },
  });

  const provider =
    queryProvider === "openai" || queryProvider === "anthropic"
      ? queryProvider
      : userConfig?.aiProvider === "openai"
        ? "openai"
        : "anthropic";

  const apiKey = process.env[`${provider.toUpperCase()}_API_KEY`] || "";
  const baseUrl =
    process.env[`${provider.toUpperCase()}_BASE_URL`] ||
    (provider === "anthropic" ? "https://api.anthropic.com" : "https://api.openai.com");

  if (!apiKey || apiKey.includes("placeholder")) {
    return NextResponse.json(
      {
        ok: false,
        provider,
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
      model: provider === "anthropic" ? "claude-sonnet-4-7-20250514" : "gpt-4o",
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
      model: provider === "anthropic" ? "claude-sonnet-4-7-20250514" : "gpt-4o",
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
        baseUrl,
        error: message,
      },
      { status: 502 }
    );
  }
}
