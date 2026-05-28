import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encryptApiKey, decryptApiKey, isEncrypted } from "@/lib/encryption";
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

  // 解密 API 密钥用于显示（前端可能需要显示部分字符）
  let apiKey = "";
  if (user?.aiApiKey) {
    try {
      // 如果已加密，解密后返回掩码版本
      if (isEncrypted(user.aiApiKey)) {
        const decrypted = decryptApiKey(user.aiApiKey);
        // 只显示前 4 位和后 4 位
        apiKey = decrypted.length > 8
          ? `${decrypted.slice(0, 4)}${"*".repeat(decrypted.length - 8)}${decrypted.slice(-4)}`
          : "*".repeat(decrypted.length);
      } else {
        // 未加密的旧数据，也返回掩码
        apiKey = user.aiApiKey.length > 8
          ? `${user.aiApiKey.slice(0, 4)}${"*".repeat(user.aiApiKey.length - 8)}${user.aiApiKey.slice(-4)}`
          : "*".repeat(user.aiApiKey.length);
      }
    } catch {
      apiKey = "****"; // 解密失败，返回占位符
    }
  }

  return NextResponse.json({
    baseUrl: user?.aiBaseUrl || "",
    apiKey,
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
    if (apiKey !== undefined) {
      // 加密 API 密钥
      try {
        updateData.aiApiKey = encryptApiKey(apiKey);
      } catch (error) {
        console.error("加密 API 密钥失败:", error);
        return NextResponse.json(
          { error: "加密配置失败，请检查服务器配置" },
          { status: 500 }
        );
      }
    }
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
