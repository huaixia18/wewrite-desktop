import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// 微信草稿箱 API
// POST https://api.weixin.qq.com/cgi-bin/draft/add?access_token=ACCESS_TOKEN
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { title, content, coverImageUrl, abstract } = await req.json();

  // 实际项目中：
  // 1. 从数据库读取用户的微信 appid/secret
  // 2. 调用微信 API 获取 access_token
  // 3. 调用草稿箱 API 上传封面图（先获取 thumb_media_id）
  // 4. 调用草稿箱 API 创建草稿

  // 模拟返回
  const mockMediaId = `draft_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  return NextResponse.json({
    mediaId: mockMediaId,
    message: "已推送到微信草稿箱，请在公众号后台确认发布",
    url: `https://mp.weixin.qq.com/cgi-bin/appmsg?t=media/appmsg_edit&action=edit&lang=zh_CN&token=mock`,
  });
}
