import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createAIClient } from "@/lib/ai";
import { isProviderConfigured, normalizeProvider, resolveUserModelForTier } from "@/lib/ai-models";
import { resolveSubscriptionTier } from "@/lib/subscription";

type GeneratedTopic = {
  id: string;
  title: string;
  score: number;
  clickPotential: number;
  seoScore: number;
  framework: string;
  keywords: string[];
  reason: string;
};

function buildTopicPrompt(
  hotspots: Array<{ title: string; keywords: string[]; score: number; platform: string }>,
  recentTitles: string[]
): string {
  const formatted = hotspots
    .slice(0, 8)
    .map(
      (h, i) =>
        `${i + 1}. [${h.platform === "weibo" ? "微博" : h.platform === "toutiao" ? "头条" : "百度"}] ${h.title} (热度: ${h.score}) 关键词: ${h.keywords.join(", ")}`
    )
    .join("\n");
  const recent = recentTitles
    .slice(0, 12)
    .map((title, index) => `${index + 1}. ${title}`)
    .join("\n");

  return `你是一个微信公众号资深编辑，擅长从热点中挖掘高传播力选题，并避免历史重复选题。

## 可用热点
${formatted}

## 最近已写过的历史选题（请尽量避开）
${recent || "无"}

## 任务
严格生成 10 个备选选题（不要少于 10 个），并满足：
- 至少 7 个“热点即时选题”
- 至少 3 个“常青选题”（可沉淀、可复用，不依赖当天热点）
- 避免与“历史选题”同题或近似题，若相近请换角度

每个选题需包含：
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

function stripCodeFences(text: string): string {
  return text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
}

function extractFirstJsonArray(text: string): string | null {
  const start = text.indexOf("[");
  if (start < 0) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < text.length; i += 1) {
    const ch = text[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === "\"") {
        inString = false;
      }
      continue;
    }

    if (ch === "\"") {
      inString = true;
      continue;
    }

    if (ch === "[") depth += 1;
    if (ch === "]") {
      depth -= 1;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }

  return null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeTopics(parsed: unknown): GeneratedTopic[] {
  if (!Array.isArray(parsed)) return [];

  const normalized: GeneratedTopic[] = [];
  for (let i = 0; i < parsed.length; i += 1) {
    const item = parsed[i];
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;

    const title = typeof record.title === "string" ? record.title.trim() : "";
    if (!title) continue;

    const score = clamp(Number(record.score) || 70, 0, 100);
    const clickPotential = clamp(Number(record.clickPotential) || 3, 1, 5);
    const seoScore = clamp(Number(record.seoScore) || 7, 1, 10);
    const framework =
      typeof record.framework === "string" && record.framework.trim()
        ? record.framework.trim()
        : "痛点型";
    const keywords = Array.isArray(record.keywords)
      ? record.keywords
          .filter((kw): kw is string => typeof kw === "string" && kw.trim().length > 0)
          .slice(0, 5)
      : [];
    const reason = typeof record.reason === "string" ? record.reason.trim() : "";

    normalized.push({
      id:
        typeof record.id === "string" && record.id.trim()
          ? record.id.trim()
          : `topic-${i + 1}`,
      title,
      score,
      clickPotential,
      seoScore,
      framework,
      keywords,
      reason,
    });
  }

  return normalized.slice(0, 10);
}

function parseTopicsSafely(raw: string): GeneratedTopic[] | null {
  const stripped = stripCodeFences(raw);
  const candidates = [raw, stripped].flatMap((text) => {
    const direct = text.trim().startsWith("[") ? text.trim() : null;
    const extracted = extractFirstJsonArray(text);
    return [direct, extracted].filter((item): item is string => Boolean(item));
  });

  for (const candidate of candidates) {
    for (const normalized of [candidate, candidate.replace(/,\s*([}\]])/g, "$1")]) {
      try {
        const parsed = JSON.parse(normalized) as unknown;
        const topics = normalizeTopics(parsed);
        if (topics.length > 0) return topics;
      } catch {
        // try next candidate
      }
    }
  }

  return null;
}

function normalizeTitleForCompare(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "")
    .replace(/[“”"'`’·\-—_:：;；,，。！？!?.、（）()【】\[\]]+/g, "");
}

function isNearDuplicateTitle(title: string, recentTitleSet: Set<string>): boolean {
  const normalized = normalizeTitleForCompare(title);
  if (!normalized) return false;
  if (recentTitleSet.has(normalized)) return true;

  for (const recent of recentTitleSet) {
    if (!recent) continue;
    if (normalized.length >= 8 && recent.includes(normalized.slice(0, 8))) return true;
    if (recent.length >= 8 && normalized.includes(recent.slice(0, 8))) return true;
  }
  return false;
}

function extractCoreKeywords(hotspots: Array<{ keywords?: string[]; title?: string }>): string[] {
  const bag = new Map<string, number>();
  for (const hotspot of hotspots) {
    for (const raw of hotspot.keywords ?? []) {
      const keyword = raw.trim();
      if (!keyword) continue;
      bag.set(keyword, (bag.get(keyword) ?? 0) + 1);
    }
  }
  return [...bag.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([keyword]) => keyword)
    .slice(0, 8);
}

function buildEvergreenTopics(
  hotspots: Array<{ keywords?: string[]; title?: string }>
): GeneratedTopic[] {
  const coreKeywords = extractCoreKeywords(hotspots);
  const k1 = coreKeywords[0] ?? "行业";
  const k2 = coreKeywords[1] ?? "增长";
  const k3 = coreKeywords[2] ?? "用户";
  const k4 = coreKeywords[3] ?? "产品";

  const templates: Array<Pick<GeneratedTopic, "title" | "framework" | "keywords" | "reason">> = [
    {
      title: `别只看热闹：${k1} 到底改变了普通人的哪 3 个决策`,
      framework: "清单型",
      keywords: [k1, k2, "决策", "方法论"],
      reason: "从长期可复用视角拆解热点背后的稳定规律",
    },
    {
      title: `从 ${k1} 到 ${k2}：未来半年值得持续追踪的 5 个信号`,
      framework: "热点解读型",
      keywords: [k1, k2, "趋势", "信号"],
      reason: "把短期事件转成长期观察框架，适合系列更新",
    },
    {
      title: `${k3} 视角下的 ${k1}：为什么多数人总在错误节点发力`,
      framework: "痛点型",
      keywords: [k1, k3, "痛点", "策略"],
      reason: "聚焦用户真实困境，增强普适性和可操作性",
    },
    {
      title: `做 ${k4} 的人都该知道：${k1} 这波变化最容易踩的 4 个坑`,
      framework: "复盘型",
      keywords: [k1, k4, "复盘", "避坑"],
      reason: "聚焦经验沉淀和避坑，天然具备常青价值",
    },
    {
      title: `${k1} 争议不断，但真正值得讨论的是这 1 个底层问题`,
      framework: "纯观点型",
      keywords: [k1, "底层逻辑", "观点", "深度"],
      reason: "从观点层面建立长期讨论价值，降低时效依赖",
    },
  ];

  return templates.map((item, index) => ({
    id: `evergreen-${index + 1}`,
    title: item.title,
    score: 66 + index * 3,
    clickPotential: 3 + (index % 2),
    seoScore: 7 + (index % 3),
    framework: item.framework,
    keywords: item.keywords.slice(0, 5),
    reason: item.reason,
  }));
}

function buildHotspotFallbackTopics(
  hotspots: Array<{ title?: string; keywords?: string[]; score?: number }>
): GeneratedTopic[] {
  const frameworks = ["热点解读型", "痛点型", "对比型", "清单型", "故事型", "纯观点型", "复盘型"];
  return hotspots.slice(0, 7).map((hotspot, index) => {
    const title = hotspot.title?.trim() || `热点议题 ${index + 1}`;
    const keywords = (hotspot.keywords ?? []).slice(0, 5);
    return {
      id: `fallback-hotspot-${index + 1}`,
      title: `${title}：普通人最该关注的 3 个关键变化`,
      score: clamp(Math.round((hotspot.score ?? 70) * 0.92), 50, 95),
      clickPotential: 4,
      seoScore: 7 + (index % 3),
      framework: frameworks[index % frameworks.length],
      keywords,
      reason: "热点关联度高，适合快速输出观点与方法。",
    };
  });
}

function rankAndMixTopics(
  aiTopics: GeneratedTopic[],
  hotspots: Array<{ keywords?: string[]; title?: string }>,
  recentTitles: string[]
): GeneratedTopic[] {
  const recentTitleSet = new Set(recentTitles.map(normalizeTitleForCompare).filter(Boolean));
  const pool = [...aiTopics, ...buildEvergreenTopics(hotspots)];
  const dedupedByTitle = new Map<string, GeneratedTopic>();

  for (const topic of pool) {
    const key = normalizeTitleForCompare(topic.title) || topic.id;
    const existing = dedupedByTitle.get(key);
    if (!existing || topic.score > existing.score) {
      dedupedByTitle.set(key, topic);
    }
  }

  const adjusted = [...dedupedByTitle.values()].map((topic) => {
    const duplicate = isNearDuplicateTitle(topic.title, recentTitleSet);
    const scoreBoost = Math.round((topic.seoScore - 6) * 1.2);
    const penalty = duplicate ? 18 : 0;
    return {
      ...topic,
      score: clamp(topic.score + scoreBoost - penalty, 0, 100),
      reason: duplicate
        ? `${topic.reason}（与历史选题相近，已自动降权）`
        : topic.reason,
    };
  });

  adjusted.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.clickPotential !== a.clickPotential) return b.clickPotential - a.clickPotential;
    return b.seoScore - a.seoScore;
  });

  const evergreen = adjusted.filter((topic) => topic.id.startsWith("evergreen-"));
  const nonEvergreen = adjusted.filter((topic) => !topic.id.startsWith("evergreen-"));
  const selected: GeneratedTopic[] = [];
  const usedKeys = new Set<string>();

  for (const topic of nonEvergreen) {
    if (selected.length >= 7) break;
    const key = normalizeTitleForCompare(topic.title);
    if (usedKeys.has(key)) continue;
    selected.push(topic);
    usedKeys.add(key);
  }

  for (const topic of evergreen) {
    if (selected.length >= 10) break;
    const key = normalizeTitleForCompare(topic.title);
    if (usedKeys.has(key)) continue;
    selected.push(topic);
    usedKeys.add(key);
  }

  for (const topic of adjusted) {
    if (selected.length >= 10) break;
    const key = normalizeTitleForCompare(topic.title);
    if (usedKeys.has(key)) continue;
    selected.push(topic);
    usedKeys.add(key);
  }

  if (selected.length < 10) {
    const fallbackKeywords = extractCoreKeywords(hotspots);
    const baseKeyword = fallbackKeywords[0] ?? "行业";
    const secondKeyword = fallbackKeywords[1] ?? "增长";
    while (selected.length < 10) {
      const index = selected.length + 1;
      const title = `${baseKeyword}观察第 ${index} 期：普通人最该建立的 ${secondKeyword}判断框架`;
      const key = normalizeTitleForCompare(title);
      if (usedKeys.has(key)) {
        continue;
      }
      selected.push({
        id: `topic-filler-${index}`,
        title,
        score: 62 + index,
        clickPotential: 3,
        seoScore: 7,
        framework: "清单型",
        keywords: [baseKeyword, secondKeyword, "方法论", "复盘"],
        reason: "补齐常青选题池，确保候选数量稳定为 10 条。",
      });
      usedKeys.add(key);
    }
  }

  return selected.slice(0, 10).map((topic, index) => ({
    ...topic,
    id: `topic-${index + 1}`,
  }));
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { hotspots } = (await req.json()) as {
    hotspots?: Array<{ title: string; keywords?: string[]; score?: number; platform?: string }>;
  };

  if (!Array.isArray(hotspots) || hotspots.length === 0) {
    return NextResponse.json({ error: "请先选择至少一个热点" }, { status: 400 });
  }

  const normalizedHotspots = hotspots.map((hotspot, index) => ({
    title: hotspot.title,
    keywords: Array.isArray(hotspot.keywords) ? hotspot.keywords : [],
    score: typeof hotspot.score === "number" ? hotspot.score : Math.max(60, 95 - index * 3),
    platform:
      hotspot.platform === "weibo" || hotspot.platform === "toutiao" || hotspot.platform === "baidu"
        ? hotspot.platform
        : "weibo",
  }));

  const recentArticles = await prisma.article.findMany({
    where: { userId: session.user.id, status: { in: ["draft", "published", "archived"] } },
    orderBy: { updatedAt: "desc" },
    take: 50,
    select: { title: true },
  });
  const recentTitles = recentArticles
    .map((item) => item.title?.trim())
    .filter((title): title is string => Boolean(title));

  const userConfig = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      aiProvider: true,
      model: true,
      subscriptionTier: true,
      subscriptionStatus: true,
      subscriptionEndsAt: true,
    },
  });

  const aiProvider = normalizeProvider(userConfig?.aiProvider);
  const tier = resolveSubscriptionTier(userConfig);
  const model = resolveUserModelForTier(aiProvider, userConfig?.model, tier);

  if (!isProviderConfigured(aiProvider)) {
    return NextResponse.json(
      { error: "AI 服务未配置，请先在服务端配置有效的网关 Key。" },
      { status: 503 }
    );
  }

  try {
    const client = createAIClient(aiProvider);
    const text = await client.chat({
      model,
      messages: [
        { role: "system", content: "你是一个专业的内容选题专家，输出严格的 JSON。" },
        { role: "user", content: buildTopicPrompt(normalizedHotspots, recentTitles) },
      ],
      maxTokens: 4096,
      temperature: 0.7,
    });

    const parsedDirect = parseTopicsSafely(text);
    if (parsedDirect) {
      const ranked = rankAndMixTopics(parsedDirect, normalizedHotspots, recentTitles);
      return NextResponse.json({
        topics: ranked,
        meta: { mode: "live", provider: aiProvider },
      });
    }

    const repairedText = await client.chat({
      model,
      messages: [
        {
          role: "system",
          content:
            "你是 JSON 修复器。请将输入修复为严格 JSON 数组，只输出数组本身，不要 markdown，不要解释。",
        },
        {
          role: "user",
          content: `请修复以下文本为 JSON 数组，每项至少包含 id,title,score,clickPotential,seoScore,framework,keywords,reason：\n${text}`,
        },
      ],
      maxTokens: 4096,
      temperature: 0,
    });

    const parsedRepaired = parseTopicsSafely(repairedText);
    if (parsedRepaired) {
      const ranked = rankAndMixTopics(parsedRepaired, normalizedHotspots, recentTitles);
      return NextResponse.json({
        topics: ranked,
        meta: { mode: "live", provider: aiProvider },
      });
    }

    const fallbackTopics = rankAndMixTopics(
      buildHotspotFallbackTopics(normalizedHotspots),
      normalizedHotspots,
      recentTitles
    );
    return NextResponse.json({
      topics: fallbackTopics,
      meta: { mode: "live", provider: aiProvider, degraded: "parse_fallback" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[/api/topics/generate]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
