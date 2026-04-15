import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createAIClient, toSSEStream, Message, type AIProvider } from "@/lib/ai";

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

框架参考：痛点型/故事型/清单型/对比型/热点解读型/纯观点型/复盘型`;

function buildMessages(params: {
  topic: { title: string; keywords: string[] };
  framework: string;
  strategy: string;
  materials: Array<{ title: string; source: string }>;
}): Message[] {
  const parts: string[] = [
    WRITING_SYSTEM_PROMPT,
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

  parts.push(
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
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { topic, framework, strategy, materials } =
    await req.json();

  // 平台托管模式：用户仅可选择 provider，key 与 baseUrl 全部走服务端环境变量
  const userConfig = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { aiProvider: true },
  });

  const aiProvider = userConfig?.aiProvider === "openai" ? "openai" : "anthropic";

  const apiKeyOrEnv =
    process.env[`${aiProvider.toUpperCase()}_API_KEY`] ||
    "";

  // 如果没有配置 Key，回退到模拟输出
  if (!apiKeyOrEnv || apiKeyOrEnv.includes("placeholder")) {
    return mockStreamResponse({ topic, framework, strategy });
  }

  try {
    const client = createAIClient(aiProvider as AIProvider);
    const messages = buildMessages({ topic, framework, strategy, materials });

    const generator = client.streamChat({
      messages,
      maxTokens: 8192,
      temperature: 0.7,
      stream: true,
    });

    return new Response(toSSEStream(generator), {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "X-AI-Provider": aiProvider,
        "X-AI-Mode": "live",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(
      `data: ${JSON.stringify({ type: "error", text: message })}\n`,
      {
        status: 500,
        headers: { "Content-Type": "text/event-stream" },
      }
    );
  }
}

// ─── Mock Fallback ────────────────────────────────────────────────────────

function mockStreamResponse(params: {
  topic: { title: string };
  framework: string;
  strategy: string;
}) {
  const encoder = new TextEncoder();

  const mockContent = `# ${params.topic.title || "AI 时代，我们如何保住自己的写作能力"}\n\n` +
    `## 一、问题的本质：我们正在被 AI 批量替代\n\n` +
    `写代码的，做设计的，现在连写文章的也要被替代了。但这件事的本质，比很多人想象的要复杂。\n\n` +
    `很多人说 AI 写的东西没有灵魂，这话对了一半。AI 写的东西确实没有"你的"灵魂，但它有**足够的**灵魂——足以让大多数读者感受不到明显差异。\n\n` +
    `问题不在于 AI 能不能写。问题在于，当 AI 能写的时候，**人为什么还要写**。\n\n` +
    `<!-- ✏️编辑建议：在这里加一个你自己的故事 -->\n\n` +
    `## 二、三个选择，三种命运\n\n` +
    `第一类：全面拥抱 AI 的效率派。什么工具出来就用什么，产出效率提高了 3-5 倍。\n\n` +
    `第二类：视 AI 为洪水猛兽的坚守派。只用 AI 搜集资料，文字必须自己写。\n\n` +
    `第三类：把 AI 当放大器的聪明人。他们用 AI 处理机械性的写作，省下来的时间花在真正的思考上。\n\n` +
    `## 三、开放性问题\n\n` +
    `你呢？你怎么看待 AI 和写作的关系？欢迎留言告诉我。`;

  const stream = new ReadableStream({
    async start(controller) {
      const lines = mockContent.split("\n");
      for (const line of lines) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "content", text: line + "\n" })}\n`
          )
        );
        await new Promise((r) => setTimeout(r, 20 + Math.random() * 30));
      }
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n`));
      controller.enqueue(encoder.encode("data: [DONE]\n"));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "X-AI-Provider": "mock",
      "X-AI-Mode": "mock",
    },
  });
}
