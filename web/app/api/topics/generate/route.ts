import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createAIClient, type AIProvider } from "@/lib/ai";

function buildTopicPrompt(
  hotspots: Array<{ title: string; keywords: string[]; score: number; platform: string }>
): string {
  const formatted = hotspots
    .slice(0, 8)
    .map(
      (h, i) =>
        `${i + 1}. [${h.platform === "weibo" ? "微博" : h.platform === "toutiao" ? "头条" : "百度"}] ${h.title} (热度: ${h.score}) 关键词: ${h.keywords.join(", ")}`
    )
    .join("\n");

  return `你是一个微信公众号资深编辑，擅长从热点中挖掘高传播力选题。

## 可用热点
${formatted}

## 任务
生成 8-10 个备选选题，每个选题需包含：
1. title（选题标题，20-30字，有冲击力）
2. score（综合评分 0-100，基于热度、独特性、可写性）
3. clickPotential（点击潜力 1-5）
4. seoScore（SEO 友好度 1-10）
5. framework（推荐文章框架：痛点型/故事型/清单型/对比型/热点解读型/纯观点型/复盘型）
6. keywords（3-5 个标签词）
7. reason（50字以内的选题理由）

直接输出 JSON 数组，不要任何前缀：
[{"id":"1","title":"...","score":85,"clickPotential":4,"seoScore":8,"framework":"痛点型","keywords":["AI","写作"],"reason":"..."}]`;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { hotspots } = await req.json();

  const userConfig = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { aiProvider: true },
  });

  const aiProvider = userConfig?.aiProvider === "openai" ? "openai" : "anthropic";

  const apiKeyOrEnv =
    process.env[`${aiProvider.toUpperCase()}_API_KEY`] ||
    "";

  if (!apiKeyOrEnv || apiKeyOrEnv.includes("placeholder")) {
    return mockTopicResponse(hotspots);
  }

  try {
    const client = createAIClient(aiProvider as AIProvider);
    const text = await client.chat({
      model: aiProvider === "anthropic" ? "claude-sonnet-4-7-20250514" : "gpt-4o",
      messages: [
        { role: "system", content: "你是一个专业的内容选题专家，输出严格的 JSON。" },
        { role: "user", content: buildTopicPrompt(hotspots) },
      ],
      maxTokens: 4096,
      temperature: 0.7,
    });

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const topics = JSON.parse(jsonMatch[0]);
      return NextResponse.json({
        topics,
        meta: { mode: "live", provider: aiProvider },
      });
    }

    return NextResponse.json({ error: "选题解析失败", raw: text }, { status: 500 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[/api/topics/generate]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function mockTopicResponse(
  hotspots: Array<{ title: string; keywords: string[]; score: number; platform: string }>
) {
  const frameworks = [
    "痛点型", "故事型", "清单型", "对比型",
    "热点解读型", "纯观点型", "复盘型",
  ];

  const topics = hotspots.slice(0, 8).map((h, i) => ({
    id: `topic-${i}`,
    title: `深度解读：${h.title.replace(/^(微博|头条|百度)重磅|微博热搜|头条热榜：/, "")}`,
    score: Math.floor(h.score * 0.9 + Math.random() * 10),
    clickPotential: Math.floor(Math.random() * 3) + 3,
    seoScore: Math.floor(Math.random() * 3) + 7,
    framework: frameworks[i % frameworks.length],
    keywords: h.keywords,
    reason: `基于${h.platform === "weibo" ? "微博" : h.platform === "toutiao" ? "头条" : "百度"}热搜，数据真实，热度${h.score > 90 ? "极高" : "较高"}`,
  }));

  return NextResponse.json({
    topics,
    meta: { mode: "mock", provider: "mock" },
  });
}
