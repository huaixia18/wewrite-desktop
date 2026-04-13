import { NextRequest } from "next/server";
import { auth } from "@/auth";

// AI 写作 Prompt（复刻 wewrite skill 的写作逻辑）
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

function buildWritingPrompt(params: {
  topic: { title: string; keywords: string[] };
  framework: string;
  strategy: string;
  materials: Array<{ title: string; source: string }>;
}): string {
  return `${WRITING_SYSTEM_PROMPT}

## 写作任务
- 选题：${params.topic.title}
- 关键词：${params.topic.keywords.join("、")}
- 框架：${params.framework}
- 增强策略：${params.strategy}
${params.materials.length > 0 ? `## 素材\n${params.materials.map((m) => `- ${m.title}（来源：${m.source}）`).join("\n")}` : ""}

请生成完整的 Markdown 文章，包含：
1. H1 标题（直接输出一级标题）
2. H2 小标题（3-4 个章节）
3. 正文内容（1500-2500 字）

直接输出 Markdown，不需要任何前缀说明。`;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { topic, framework, strategy, materials } = await req.json();

  // 优先使用用户自己的 Key，否则用服务端 Key
  // const apiKey = session.user?.id ? (await getUserKey(session.user.id)) : process.env.ANTHROPIC_API_KEY;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n`));
      };

      try {
        // 模拟流式输出（实际项目中替换为真实的 Anthropic/OpenAI 流式调用）
        const content = buildMockArticle({ topic, framework, strategy });

        // 逐行流式发送
        const lines = content.split("\n");
        for (const line of lines) {
          if (line.trim()) {
            send({ type: "content", text: line + "\n" });
            await new Promise((r) => setTimeout(r, 20 + Math.random() * 30));
          } else {
            send({ type: "content", text: "\n" });
          }
        }

        send({ type: "title", text: topic?.title || "未命名" });
        send({ type: "done", text: "done" });
        controller.enqueue(encoder.encode("data: [DONE]\n"));
      } catch (err) {
        send({ type: "error", text: String(err) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}

function buildMockArticle(params: {
  topic: { title: string };
  framework: string;
  strategy: string;
}): string {
  const title = `# ${params.topic.title || "AI 时代，我们如何保住自己的写作能力"}`;
  const body = `
## 一、问题的本质：我们正在被 AI 批量替代

写代码的、做设计的，现在连写文章的也要被替代了。但这件事的本质，比很多人想象的要复杂。

我认识一个做了 10 年内容运营的朋友，上个月被裁员了。不是因为 AI 比他写得好，而是因为 AI 比他**便宜得多**。老板算了一笔账：养一个内容团队一年的人力成本，够买三年的 AI 写作服务。

这是现实。不是危言耸听。

很多人说 AI 写的东西没有灵魂，这话对了一半。AI 写的东西确实没有"你的"灵魂，但它有**足够的**灵魂——足以让大多数读者感受不到明显差异，足以通过平台的原创审核，足以让一篇 3000 字的文章在 30 秒内完成初稿。

问题不在于 AI 能不能写。问题在于，当 AI 能写的时候，**人为什么还要写**。

<!-- ✏️编辑建议：在这里加一个你自己的故事或者你身边的例子 -->

## 二、真实案例：三个不同选择，三种不同命运

我观察了身边三类内容创作者，他们面对 AI 的态度截然不同，结局也天差地别。

**第一类：全面拥抱 AI 的效率派**

效率派的特点是：什么工具出来就用什么，AI 能干的绝不动手。他们的产出效率提高了 3-5 倍，但单价也在持续下滑。原因很简单：当所有人都用 AI 写的时候，差异化就不存在了。

**第二类：视 AI 为洪水猛兽的坚守派**

坚守派的原则是：只用 AI 搜集资料，文字必须自己写。这种态度值得尊敬，但效率实在太低。在平台算法越来越倾向于高产的背景下，他们的生存空间被不断压缩。

**第三类：把 AI 当放大器的聪明人**

<!-- ✏️编辑建议：这里可以插入你用过效果最好的一个 AI 提示词 -->

这类人不是问"AI 能替代我吗"，而是问"我怎么用 AI 放大我的能力"。他们用 AI 处理机械性的写作，把省下来的时间花在真正的思考和判断上。他们的内容产量和质量都在上升。

## 三、方法论：如何在 AI 时代建立真正的壁垒

说了这么多，最关键的问题来了：**具体怎么做？**

我总结了一套"三层壁垒"模型：

**第一层：信息差**

AI 能处理的是公开信息。如果你有独特的信息渠道——行业内部消息、一手采访资源、独家数据——这是 AI 无法替代的护城河。

**第二层：人格化**

同一个事实，不同的人写出来，味道完全不同。这种"味道"来自你的经历、你的判断、你的性格。AI 可以模仿风格，但无法复制你的人格。

**第三层：关系资产**

读者为什么关注你而不是别人？因为他们关注的是**你这个人**。这种关系资产是最难被 AI 替代的。

## 四、开放性问题

我在写这篇文章的时候，也在问自己：三年后，我还会在这里写东西吗？

我不知道答案。但我知道一件事：写作这件事本身，永远有它的价值——不是因为它能产出内容，而是因为它能帮我们**想清楚**。

AI 能帮你写，但它没法帮你想。

你呢？你怎么看待 AI 和写作的关系？欢迎留言告诉我。`;

  return `${title}\n${body}`;
}
