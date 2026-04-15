import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { spawn } from "child_process";
import { join } from "path";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  try {
    // 调用 Python 脚本抓取真实热点
    const scriptPath = join(process.cwd(), "scripts", "fetch_hotspots.py");
    const raw = await new Promise<string>((resolve, reject) => {
      const proc = spawn("python3", [scriptPath, "--limit", "20"]);
      let stdout = "";
      let stderr = "";
      proc.stdout.on("data", (d) => (stdout += d));
      proc.stderr.on("data", (d) => (stderr += d));
      proc.on("close", (code) => {
        if (code === 0) resolve(stdout);
        else reject(new Error(stderr || `python exit ${code}`));
      });
      proc.on("error", reject);
    });

    const data = JSON.parse(raw);

    // 转换为前端期望的格式
    const hotspots = (data.items ?? []).map((item: {
      title: string;
      source: string;
      hot_normalized: number;
      description?: string;
    }) => ({
      id: Buffer.from(item.title.slice(0, 20)).toString("base64"),
      platform:
        item.source === "微博"
          ? "weibo"
          : item.source === "今日头条"
            ? "toutiao"
            : "baidu",
      title: item.title,
      score: item.hot_normalized,
      keywords: item.description
        ? [item.description]
        : item.title.split(/[,，、]/).slice(0, 3),
      trend: item.hot_normalized > 80 ? "rising" : item.hot_normalized > 60 ? "stable" : "fading",
    }));

    return NextResponse.json({
      hotspots,
      sources: data.sources ?? [],
      timestamp: data.timestamp,
      meta: { mode: "live" },
    });
  } catch (err) {
    // 抓取失败时返回优雅的兜底数据
    console.error("[/api/topics/hotspots]", err instanceof Error ? err.message : String(err));
    return NextResponse.json({
      hotspots: [
        { id: "1", platform: "weibo", title: "微信重磅更新：公众号可跳转小红书", score: 98, keywords: ["微信", "公众号", "小红书"], trend: "rising" },
        { id: "2", platform: "toutiao", title: "AI 写作工具月活突破 5000 万", score: 95, keywords: ["AI", "写作工具"], trend: "rising" },
        { id: "3", platform: "baidu", title: "Claude 4 发布，编程能力超越 GPT-5", score: 92, keywords: ["Claude", "AI", "GPT"], trend: "rising" },
      ],
      sources: [],
      error: "抓取失败，使用兜底数据",
      meta: { mode: "fallback" },
    });
  }
}
