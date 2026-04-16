import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createAIClient, toSSEStream, Message } from "@/lib/ai";
import { isProviderConfigured, normalizeProvider, resolveUserModelForTier } from "@/lib/ai-models";
import { resolveSubscriptionTier } from "@/lib/subscription";

// ─── System Prompt ────────────────────────────────────────────────────────

const WRITING_SYSTEM_PROMPT = `你是一个微信公众号资深编辑，擅长写高传播力的原创文章。

写作要求（严格遵守）：
1. 标题 20-28 字，有冲击力，能引发好奇或共鸣
2. 每个 H2 不少于 300 字，信息密度高
3. 句长变化大（10字短句和40字长句交替）
4. 词汇温度：冷/热/野混用，避免AI味
5. ≥20%负面情绪词，≤3个副词/100字
6. 每个H2段至少有1个具体人名/数据/地点
7. 禁止使用：首先/其次/总之/作为一个/让我们
8. 插入 <!-- ✏️编辑建议 --> 提示编辑加个人经历
9. 结尾留开放性问题，不给通用正面结尾
10. 必须紧扣用户给定“选题”，禁止换题、跑题或改写为其他事件
11. 禁止编造具体事实（人名、机构、时间、地点、数字）；不确定的信息标注“【待核实】”
12. 若素材不足，宁可减少事实断言，也不要杜撰细节

框架参考：痛点型/故事型/清单型/对比型/热点解读型/纯观点型/复盘型`;

const PERSONA_PROMPTS: Record<string, string> = {
  "midnight-friend":
    "写作口吻像深夜和朋友聊天，第一人称，真诚克制，不端着。",
  "warm-editor":
    "写作口吻温暖、叙事感强，先讲人再讲观点，数据作为支撑。",
  "industry-observer":
    "写作口吻中性客观，强调数据、趋势和可验证论据，避免情绪化判断。",
  "sharp-journalist":
    "写作口吻犀利但有证据，观点明确，反问和对比适度，不煽动。",
  "cold-analyst":
    "写作口吻冷静克制，逻辑严密，减少修辞，优先结构化表达。",
};

type WritingContext = {
  persona: string;
  humanizerStrict: string;
  playbooks: Array<{ rule: string; confidence: number; source: string | null }>;
  exemplars: Array<{
    title: string;
    category: string | null;
    sourceAccount: string | null;
    openingHook: string | null;
    content: string;
  }>;
};

function buildMessages(params: {
  topic: { title: string; keywords: string[] };
  framework: string;
  strategy: string;
  materials: Array<{ title: string; source: string }>;
  context: WritingContext;
}): Message[] {
  const personaPrompt =
    PERSONA_PROMPTS[params.context.persona] ??
    "写作口吻保持自然口语化，避免模板腔和空话。";
  const parts: string[] = [
    WRITING_SYSTEM_PROMPT,
    "",
    "## 人设与风格",
    `- Persona：${params.context.persona}`,
    `- 风格要求：${personaPrompt}`,
    `- Humanizer 强度：${params.context.humanizerStrict}`,
    "",
    "## 写作任务",
    `- 选题：${params.topic.title}`,
    `- 关键词：${params.topic.keywords.join("、")}`,
    `- 框架：${params.framework}`,
    `- 增强策略：${params.strategy}`,
  ];

  if (params.materials.length > 0) {
    parts.push(
      "",
      "## 素材",
      ...params.materials.map((m) => `- ${m.title}（来源：${m.source}）`)
    );
  }

  if (params.context.playbooks.length > 0) {
    parts.push(
      "",
      "## 个人 Playbook（优先遵守）",
      ...params.context.playbooks.map(
        (item) =>
          `- ${item.rule}（置信度 ${item.confidence}/10${item.source ? `，来源：${item.source}` : ""}）`
      )
    );
  }

  if (params.context.exemplars.length > 0) {
    parts.push(
      "",
      "## 范文参照（只学写法，不抄内容）",
      ...params.context.exemplars.map((item, index) => {
        const opening = item.openingHook?.trim()
          ? item.openingHook.trim()
          : item.content.replace(/\s+/g, " ").slice(0, 80);
        return `${index + 1}. 《${item.title}》${item.category ? ` [${item.category}]` : ""}${
          item.sourceAccount ? `（来源账号：${item.sourceAccount}）` : ""
        }\n   - 可借鉴开头：${opening}`;
      })
    );
  }

  parts.push(
    "",
    "## 硬约束（必须满足）",
    `- 全文只讨论该选题：${params.topic.title}`,
    "- H1 标题必须与选题高度一致（可微调但不能改变事件主体）",
    "- 严禁出现与该选题无关的示例/案例",
    "- 若素材与选题冲突，以选题为准并明确标注“【待核实】”",
    "",
    "请生成完整的 Markdown 文章，包含：",
    "1. H1 标题（直接输出一级标题）",
    "2. H2 小标题（3-4 个章节）",
    "3. 正文内容（1500-2500 字）",
    "",
    "直接输出 Markdown，不需要任何前缀说明。"
  );

  return [
    { role: "system", content: WRITING_SYSTEM_PROMPT },
    { role: "user", content: parts.join("\n") },
  ];
}

// ─── Route Handler ──────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { topic, framework, strategy, materials } = await req.json();
  if (!topic?.title || !Array.isArray(topic?.keywords) || !framework || !strategy) {
    return new Response("写作参数不完整，请先完成选题与框架步骤。", { status: 400 });
  }

  // 平台托管模式：用户仅可选择 provider，key 与 baseUrl 全部走服务端环境变量
  const [userConfig, playbooks, exemplars] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        aiProvider: true,
        model: true,
        styleConfig: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        subscriptionEndsAt: true,
      },
    }),
    prisma.playbook.findMany({
      where: { userId: session.user.id },
      orderBy: [{ confidence: "desc" }, { createdAt: "desc" }],
      take: 8,
      select: {
        rule: true,
        confidence: true,
        source: true,
      },
    }),
    prisma.exemplar.findMany({
      where: { userId: session.user.id },
      orderBy: { addedAt: "desc" },
      take: 3,
      select: {
        title: true,
        category: true,
        sourceAccount: true,
        openingHook: true,
        content: true,
      },
    }),
  ]);

  const aiProvider = normalizeProvider(userConfig?.aiProvider);
  const tier = resolveSubscriptionTier(userConfig);
  const model = resolveUserModelForTier(aiProvider, userConfig?.model, tier);
  const styleConfig = (userConfig?.styleConfig ?? {}) as Record<string, unknown>;
  const persona =
    typeof styleConfig.persona === "string" && styleConfig.persona.trim()
      ? styleConfig.persona.trim()
      : "midnight-friend";
  const humanizerStrict =
    typeof styleConfig.humanizerStrict === "string" && styleConfig.humanizerStrict.trim()
      ? styleConfig.humanizerStrict.trim()
      : "standard";

  if (!isProviderConfigured(aiProvider)) {
    return new Response("AI 服务未配置，请先在服务端配置有效的网关 Key。", { status: 503 });
  }

  try {
    const client = createAIClient(aiProvider);
    const messages = buildMessages({
      topic,
      framework,
      strategy,
      materials,
      context: {
        persona,
        humanizerStrict,
        playbooks,
        exemplars,
      },
    });

    const generator = client.streamChat({
      model,
      messages,
      maxTokens: 8192,
      temperature: 0.35,
      stream: true,
    });

    return new Response(toSSEStream(generator), {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "X-AI-Provider": aiProvider,
        "X-AI-Model": model,
        "X-AI-Mode": "live",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(
      `data: ${JSON.stringify({ type: "error", text: message })}\n\n`,
      {
        status: 500,
        headers: { "Content-Type": "text/event-stream" },
      }
    );
  }
}
