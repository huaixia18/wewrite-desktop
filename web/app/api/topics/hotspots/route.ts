import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { spawn } from "child_process";
import { join } from "path";

function buildHotspotId(source: string, title: string): string {
  return Buffer.from(`${source}:${title}`, "utf8").toString("base64url");
}

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  try {
    // 调用 Python 脚本抓取真实热点
    const scriptPath = join(process.cwd(), "scripts", "fetch_hotspots.py");
    const raw = await new Promise<string>((resolve, reject) => {
      const proc = spawn("python3", [scriptPath, "--limit", "12"]);
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
      id: buildHotspotId(item.source, item.title),
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
    const message = err instanceof Error ? err.message : String(err);
    console.error("[/api/topics/hotspots]", message);
    return NextResponse.json(
      {
        error: `热点抓取失败：${message}`,
      },
      { status: 502 }
    );
  }
}
