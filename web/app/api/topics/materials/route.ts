import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { spawn } from "child_process";
import { join } from "path";

interface HotspotItem {
  title: string;
  source: string;
  url?: string;
  description?: string;
}

interface FetchHotspotsOutput {
  items?: HotspotItem[];
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const body = (await req.json()) as { keywords?: unknown };
  const keywords = Array.isArray(body.keywords)
    ? body.keywords.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];

  if (keywords.length === 0) {
    return NextResponse.json({ error: "缺少关键词，无法采集素材" }, { status: 400 });
  }

  try {
    const scriptPath = join(process.cwd(), "scripts", "fetch_hotspots.py");
    const raw = await new Promise<string>((resolve, reject) => {
      const proc = spawn("python3", [scriptPath, "--limit", "60"]);
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

    const parsed = JSON.parse(raw) as FetchHotspotsOutput;
    const items = Array.isArray(parsed.items) ? parsed.items : [];

    const normalizedKeywords = keywords.map((kw) => kw.trim().toLowerCase());
    const matched = items.filter((item) => {
      const haystack = `${item.title} ${item.description ?? ""}`.toLowerCase();
      return normalizedKeywords.some((kw) => haystack.includes(kw));
    });

    const selected = (matched.length > 0 ? matched : items).slice(0, 8);
    const materials = selected.map((item) => ({
      title: item.title,
      source: item.source || "热点源",
      url: item.url || "",
    }));

    if (materials.length === 0) {
      return NextResponse.json({ error: "未检索到可用素材，请稍后重试" }, { status: 502 });
    }

    return NextResponse.json({
      materials,
      meta: { mode: "live" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `素材采集失败：${message}` }, { status: 502 });
  }
}
