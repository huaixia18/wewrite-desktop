import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

// 微信草稿箱 API
// POST https://api.weixin.qq.com/cgi-bin/draft/add?access_token=ACCESS_TOKEN
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "未登录" }, { status: 401 });

  await req.json();

  return NextResponse.json(
    {
      error: "当前版本未接入真实微信草稿箱发布能力，请先完成微信发布服务端实现。",
    },
    { status: 501 }
  );
}
