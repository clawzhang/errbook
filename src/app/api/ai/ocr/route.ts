import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUserAIConfig, callAI, buildOCRPrompt } from "@/lib/ai";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const config = await getUserAIConfig(session.user.id);
  if (!config) {
    return NextResponse.json(
      { error: "请先在设置中配置 AI 服务" },
      { status: 400 }
    );
  }

  try {
    const formData = await request.formData();
    const imageFile = formData.get("image") as File | null;

    if (!imageFile) {
      return NextResponse.json({ error: "请上传图片" }, { status: 400 });
    }

    const buffer = Buffer.from(await imageFile.arrayBuffer());
    const base64 = buffer.toString("base64");
    const mimeType = imageFile.type || "image/jpeg";
    const dataUrl = `data:${mimeType};base64,${base64}`;

    const messages = [
      buildOCRPrompt(),
      {
        role: "user" as const,
        content: [
          { type: "image_url" as const, image_url: { url: dataUrl } },
          {
            type: "text" as const,
            text: "请识别这张图片中的错题内容",
          },
        ],
      },
    ];

    const result = await callAI(config, messages, { temperature: 0.3 });
    let parsed;
    try {
      const cleaned = result.replace(/```json\n?|```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
      if (!parsed.questionType) {
        parsed.questionType = "OTHER";
      }
    } catch {
      parsed = {
        question: result,
        wrongAnswer: "",
        correctAnswer: "",
        analysis: "",
        subject: "MATH",
        questionType: "OTHER",
        knowledgePoint: "",
        errorReason: "",
      };
    }

    return NextResponse.json({ result: parsed });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "识别失败";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
