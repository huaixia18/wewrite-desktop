import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  // 模拟热点数据（实际项目中应接入微博/头条/百度 API）
  const hotspots = [
    { id: "1", platform: "weibo", title: "微信重磅更新：公众号可跳转小红书", score: 98, url: "#", keywords: ["微信", "公众号", "小红书"], trend: "rising" },
    { id: "2", platform: "toutiao", title: "AI 写作工具月活突破 5000 万", score: 95, url: "#", keywords: ["AI", "写作工具", "月活"], trend: "rising" },
    { id: "3", platform: "baidu", title: "Claude 4 发布，编程能力超越 GPT-5", score: 92, url: "#", keywords: ["Claude", "AI", "GPT"], trend: "rising" },
    { id: "4", platform: "weibo", title: "马斯克：未来 10 年 AI 将替代 50% 工作", score: 88, url: "#", keywords: ["AI", "马斯克", "就业"], trend: "stable" },
    { id: "5", platform: "toutiao", title: "抖音测试「不看此内容」功能引热议", score: 85, url: "#", keywords: ["抖音", "功能"], trend: "rising" },
    { id: "6", platform: "baidu", title: "国产大模型价格战：API 调用费用下降 90%", score: 82, url: "#", keywords: ["大模型", "API", "价格战"], trend: "fading" },
    { id: "7", platform: "weibo", title: "雷军：小米汽车交付量突破 10 万台", score: 80, url: "#", keywords: ["小米", "汽车", "雷军"], trend: "stable" },
    { id: "8", platform: "toutiao", title: "GitHub Copilot 推免费版，程序员慌了", score: 78, url: "#", keywords: ["GitHub", "Copilot", "程序员"], trend: "rising" },
    { id: "9", platform: "baidu", title: "AI 生成内容标注法规正式实施", score: 75, url: "#", keywords: ["AI法规", "内容标注"], trend: "stable" },
    { id: "10", platform: "weibo", title: "OpenAI 宣布 Sora 向全球开放", score: 73, url: "#", keywords: ["OpenAI", "Sora", "视频生成"], trend: "fading" },
  ];

  return NextResponse.json({ hotspots });
}
