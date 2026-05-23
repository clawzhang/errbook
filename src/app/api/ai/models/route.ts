import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  try {
    const { baseUrl, apiKey } = await request.json();

    if (!baseUrl || !apiKey) {
      return NextResponse.json({ error: "缺少必要参数" }, { status: 400 });
    }

    // 尝试调用 /v1/models 接口获取模型列表
    const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");
    const modelsUrl = normalizedBaseUrl.endsWith("/v1")
      ? `${normalizedBaseUrl}/models`
      : `${normalizedBaseUrl}/v1/models`;

    const response = await fetch(modelsUrl, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(10000), // 10秒超时
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "无法获取模型列表", supported: false },
        { status: 200 }
      );
    }

    const data = await response.json();

    // OpenAI 格式：{ data: [{ id: "model-name", ... }] }
    if (data.data && Array.isArray(data.data)) {
      const models = data.data.map((m: { id: string }) => m.id);
      return NextResponse.json({ models, supported: true });
    }

    return NextResponse.json(
      { error: "不支持的响应格式", supported: false },
      { status: 200 }
    );
  } catch (error) {
    console.error("Fetch models error:", error);
    return NextResponse.json(
      { error: "获取模型列表失败", supported: false },
      { status: 200 }
    );
  }
}
