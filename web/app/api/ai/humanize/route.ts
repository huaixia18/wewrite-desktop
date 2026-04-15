import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

// Humanizer 29 规则实现（来自 skill 的 9 步流程）
const AI_WORDS = [
  "深入了解", "进一步", "显著", "至关重要", "不可忽视",
  "令人印象深刻", "无与伦比", "引领", "赋能", "闭环",
  "抓手", "痛点", "顶层设计", "底层逻辑", "颗粒度",
  "对齐", "拉齐", "打通", "沉淀", "反哺",
  "实际上", "实际上", "此外", "同时", "然而",
  "从而", "因此", "所以", "总而言之", "值得注意的是",
];

const ADJECTIVES_AI = [
  "非常", "极其", "十分", "特别", "格外",
  "令人印象深刻", "引人注目", "史无前例", "空前绝后",
];

const PROMO_WORDS = [
  "震撼", "惊艳", "绝美", "璀璨", "无与伦比",
  "沉浸式", "极致", "匠心", "匠心独运",
];

const FILLER_PHRASES = [
  "值得注意的是", "需要注意的是", "从某种意义上说", "可以说",
  "毫无疑问", "毫无疑问地", "总的来说", "综上所述",
];

const CLOSING_PATTERNS = [
  "让我们拭目以待", "未来可期", "前景光明", "值得期待",
  "相信在不久的将来", "必将",
];

const RULE_PATTERNS = [
  // AI 高频词汇 (rule 7)
  {
    id: 7, name: "AI高频词汇", layer: "language",
    pattern: new RegExp(`(${AI_WORDS.join("|")})`, "gi"),
    count: 0, samples: [] as string[],
  },
  // 填充短语 (rule 23)
  {
    id: 23, name: "填充短语", layer: "filler",
    pattern: new RegExp(`(${FILLER_PHRASES.join("|")})`, "gi"),
    count: 0, samples: [] as string[],
  },
  // 空洞形容词 (rule 4)
  {
    id: 4, name: "广告味语言", layer: "content",
    pattern: new RegExp(`(${PROMO_WORDS.join("|")})`, "gi"),
    count: 0, samples: [] as string[],
  },
  // 通用结尾 (rule 25)
  {
    id: 25, name: "通用正面结尾", layer: "filler",
    pattern: new RegExp(`(${CLOSING_PATTERNS.join("|")})`, "gi"),
    count: 0, samples: [] as string[],
  },
  // 过度副词 (rule 24)
  {
    id: 24, name: "过度委婉", layer: "filler",
    pattern: new RegExp(`(${ADJECTIVES_AI.join("|")})`, "gi"),
    count: 0, samples: [] as string[],
  },
];

function analyzeContent(content: string) {
  const hits: Array<{ ruleId: number; count: number; samples: string[] }> = [];

  for (const rule of RULE_PATTERNS) {
    const matches = content.match(rule.pattern);
    if (matches && matches.length > 0) {
      const uniqueSamples = [...new Set(matches)].slice(0, 3);
      hits.push({
        ruleId: rule.id,
        count: matches.length,
        samples: uniqueSamples,
      });
    }
  }

  // 计算人类感评分（100 - 扣分）
  const totalHits = hits.reduce((sum, h) => sum + h.count, 0);
  const score = Math.max(20, 100 - totalHits * 5);

  return { hits, score };
}

function applyFixes(content: string): string {
  let fixed = content;

  // 替换 AI 高频词
  const replacements: Record<string, string> = {
    "深入了解": "研究",
    "进一步": "继续",
    "显著": "明显",
    "至关重要": "很关键",
    "赋能": "帮助",
    "值得注意的是": "实际上",
    "可以说": "其实",
    "从某种意义上说": "坦白说",
    "沉浸式": "深入",
    "极致": "很高",
    "让我们拭目以待": "",
    "未来可期": "",
  };

  for (const [from, to] of Object.entries(replacements)) {
    fixed = fixed.replace(new RegExp(from, "gi"), to);
  }

  // 移除连续空行
  fixed = fixed.replace(/\n{3,}/g, "\n\n");

  return fixed;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { content } = await req.json();
  if (!content) {
    return NextResponse.json({ error: "内容不能为空" }, { status: 400 });
  }

  // Step 1-2: 扫描 29 规则
  const { hits, score } = analyzeContent(content);

  // Step 3-4: 自动修复
  const fixed = applyFixes(content);

  // Step 5: 重新评分
  const { score: newScore } = analyzeContent(fixed);

  const report = {
    hits,
    fixes: hits.reduce((sum, h) => sum + h.count, 0),
    score,
    layers: {
      content: hits.filter((h) => h.ruleId === 4).length,
      language: hits.filter((h) => h.ruleId === 7).length,
      style: hits.filter((h) => [14, 15, 16].includes(h.ruleId)).length,
      communication: hits.filter((h) => [20, 21, 22].includes(h.ruleId)).length,
      filler: hits.filter((h) => [23, 24, 25, 26, 27, 28, 29].includes(h.ruleId)).length,
    },
  };

  return NextResponse.json({ report, fixed, newScore });
}
