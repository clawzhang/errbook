import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const aiConfigSchema = z.object({
  baseUrl: z.string().url("请输入有效的 URL").optional(),
  apiKey: z.string().min(1, "API Key 不能为空").optional(),
  model: z.string().min(1, "模型名称不能为空").optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { aiBaseUrl: true, aiApiKey: true, aiModel: true },
  });

  return NextResponse.json({
    baseUrl: user?.aiBaseUrl || "",
    apiKey: user?.aiApiKey || "",
    model: user?.aiModel || "",
  });
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const result = aiConfigSchema.safeParse(body);

    if (!result.success) {
      console.error("AI config validation error:", result.error.flatten());
      const firstError =
        Object.values(result.error.flatten().fieldErrors)[0]?.[0] ||
        "参数错误";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { baseUrl, apiKey, model } = result.data;

    // 只更新提供的字段
    const updateData: {
      aiBaseUrl?: string;
      aiApiKey?: string;
      aiModel?: string;
    } = {};

    if (baseUrl !== undefined) updateData.aiBaseUrl = baseUrl;
    if (apiKey !== undefined) updateData.aiApiKey = apiKey;
    if (model !== undefined) updateData.aiModel = model;

    await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("AI config save error:", error);
    return NextResponse.json({ error: "保存失败" }, { status: 500 });
  }
}
