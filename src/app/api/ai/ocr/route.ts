import { NextRequest } from "next/server";
import { withApiHandler } from "@/lib/api-handler";
import { getUserAIConfig, callAI, buildOCRPrompt } from "@/lib/ai";
import { ValidationError, ExternalServiceError } from "@/lib/errors";

export const POST = withApiHandler(
  async (request: NextRequest) => {
    const userId = (request as any).user.id;

    const config = await getUserAIConfig(userId);
    if (!config) {
      throw new ValidationError("请先在设置中配置 AI 服务");
    }

    const formData = await request.formData();
    const imageFile = formData.get("image") as File | null;

    if (!imageFile) {
      throw new ValidationError("请上传图片");
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

    try {
      const result = await callAI(config, messages, { temperature: 0.3 });
      let parsed;
      try {
        const cleaned = result.replace(/```json\n?|```\n?/g, "").trim();
        parsed = JSON.parse(cleaned);
      } catch {
        parsed = {
          question: result,
          wrongAnswer: "",
          correctAnswer: "",
          analysis: "",
          subject: "MATH",
          knowledgePoint: "",
          errorReason: "",
        };
      }

      return { result: parsed };
    } catch (error) {
      throw new ExternalServiceError("AI OCR", error);
    }
  },
  { requireAuth: true }
);
