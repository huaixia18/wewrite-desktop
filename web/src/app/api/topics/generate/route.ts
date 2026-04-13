import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { hotspots } = await req.json();

  // 模拟 AI 选题生成（实际项目中应调用 AI API）
  const topics = hotspots.slice(0, 8).map((h: { title: string; keywords: string[]; score: number; platform: string }, i: number) => {
    const frameworks = ["痛点型", "故事型", "清单型", "对比型", "热点解读型", "纯观点型", "复盘型"];
    const framework = frameworks[i % frameworks.length];
    return {
      id: `topic-${i}`,
      title: `深度解读：${h.title.replace(/^(微博|头条|百度)重磅|微博热搜|头条热榜：/, "")}`,
      score: Math.floor(h.score * 0.9 + Math.random() * 10),
      clickPotential: Math.floor(Math.random() * 3) + 3,
      seoScore: Math.floor(Math.random() * 3) + 7,
      framework,
      keywords: h.keywords,
      reason: `基于${h.platform === "weibo" ? "微博" : h.platform === "toutiao" ? "头条" : "百度"}热搜，数据真实，热度${h.score > 90 ? "极高" : "较高"}，适合从${framework}角度切入`,
    };
  });

  return NextResponse.json({ topics });
}
