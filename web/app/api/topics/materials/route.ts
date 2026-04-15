import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { keywords } = await req.json();

  // 模拟素材采集
  const materials = keywords.slice(0, 5).flatMap((kw: string) => [
    {
      title: `${kw}相关数据报告：2024年用户行为分析`,
      source: "艾瑞咨询",
      url: "#",
    },
    {
      title: `${kw}行业最新动态（2024 Q1）`,
      source: "36氪",
      url: "#",
    },
  ]).slice(0, 8);

  return NextResponse.json({
    materials,
    meta: { mode: "mock" },
  });
}
