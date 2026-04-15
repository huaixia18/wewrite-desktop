import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createAIClient, type AIProvider } from "@/lib/ai";

// ─── 封面图 Prompt ────────────────────────────────────────────────────────

function buildCoverPrompt(title: string, content: string): string {
  const summary = content
    .replace(/[#*`>\n\[\]]/g, "")
    .replace(/\*\*/g, "")
    .slice(0, 200);

  return `请为以下微信公众号文章生成封面图提示词（用于 AI 绘图）：

文章标题：${title}
文章摘要：${summary}

要求：
1. 风格：简约大气，现代感，扁平插画风格
2. 色调：暖色调为主，呼应文章情绪
3. 比例：16:9（900x506px）
4. 无文字，纯视觉表达
5. 适合社交媒体传播

请直接输出一段英文 Prompt（用于 DALL-E / Midjourney / Flux 等绘图工具），不超过 200 词。`;
}

// ─── Route Handler ────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { title, content } = await req.json();

  const userConfig = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { aiProvider: true },
  });

  const aiProvider = userConfig?.aiProvider === "openai" ? "openai" : "anthropic";

  const apiKeyOrEnv =
    process.env[`${aiProvider.toUpperCase()}_API_KEY`] ||
    "";

  if (!apiKeyOrEnv || apiKeyOrEnv.includes("placeholder")) {
    // Mock fallback: 返回 Unsplash 占位图
    const imageUrl = `https://picsum.photos/seed/${encodeURIComponent(title ?? "wewrite")}/900/506`;
    return NextResponse.json({
      imageUrl,
      prompt: `微信公众号封面图，主题：${title}，风格：简约大气，现代感，扁平插画风格，暖色调`,
      meta: { mode: "mock", provider: "mock" },
    });
  }

  try {
    const client = createAIClient(aiProvider as AIProvider);
    const prompt = await client.chat({
      model: aiProvider === "anthropic" ? "claude-sonnet-4-7-20250514" : "gpt-4o",
      messages: [
        { role: "system", content: "你是一个创意视觉提示词专家。" },
        { role: "user", content: buildCoverPrompt(title, content) },
      ],
      maxTokens: 512,
      temperature: 0.8,
    });

    // 如果配置了绘图 API Key，调用绘图；否则返回 prompt 由前端处理
    const imageGenKey =
      process.env.IMAGE_GEN_API_KEY ??
      process.env.OPENAI_API_KEY;
    const imageBaseUrl =
      process.env.IMAGE_GEN_BASE_URL ??
      process.env.OPENAI_BASE_URL;

    let imageUrl = "";

    if (imageGenKey && imageBaseUrl) {
      // 调用绘图 API（OpenAI DALL-E 3 / 代理兼容）
      const imageRes = await fetch(`${imageBaseUrl}/v1/images/generations`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${imageGenKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt,
          n: 1,
          size: "1792x1024",
        }),
      });

      if (imageRes.ok) {
        const imageData = await imageRes.json();
        imageUrl = imageData.data?.[0]?.url ?? "";
      }
    }

    // 如果绘图失败或未配置，返回占位图
    if (!imageUrl) {
      imageUrl = `https://picsum.photos/seed/${encodeURIComponent(title ?? "wewrite")}/900/506`;
    }

    return NextResponse.json({
      imageUrl,
      prompt,
      meta: { mode: "live", provider: aiProvider },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
