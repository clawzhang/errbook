import { prisma } from "@/lib/prisma";

interface AIConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

export async function getUserAIConfig(
  userId: string
): Promise<AIConfig | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { aiBaseUrl: true, aiApiKey: true, aiModel: true },
  });

  if (!user?.aiBaseUrl || !user?.aiApiKey || !user?.aiModel) return null;

  return {
    baseUrl: user.aiBaseUrl,
    apiKey: user.aiApiKey,
    model: user.aiModel,
  };
}

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string | MessageContent[];
}

type MessageContent =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

export async function callAI(
  config: AIConfig,
  messages: ChatMessage[],
  options?: { temperature?: number; maxTokens?: number }
): Promise<string> {
  const normalizedBaseUrl = config.baseUrl.replace(/\/+$/, "");
  const url = normalizedBaseUrl.endsWith("/v1")
    ? `${normalizedBaseUrl}/chat/completions`
    : `${normalizedBaseUrl}/v1/chat/completions`;

  const body = {
    model: config.model,
    messages,
    temperature: options?.temperature ?? 0.7,
    max_tokens: options?.maxTokens ?? 2000,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`AI 请求失败 (${res.status}): ${text.slice(0, 200)}`);
  }

  const resClone = res.clone();
  let data: {
    choices?: Array<{
      message?: {
        content?: string;
      };
    }>;
  };

  try {
    data = await res.json();
  } catch {
    const text = await resClone.text().catch(() => "");
    const preview = text.replace(/\s+/g, " ").slice(0, 120);
    throw new Error(
      `AI 服务返回了非 JSON 响应，请确认 Base URL 指向兼容 OpenAI 的接口。响应片段：${preview || "空响应"}`
    );
  }

  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("AI 未返回有效内容，请检查所选模型是否支持聊天补全接口");
  }

  return content;
}

export function buildOCRPrompt(): ChatMessage {
  return {
    role: "system",
    content: `你是一个 OCR 识别助手。用户会上传一张错题图片，请仔细识别图片中的内容，并按以下 JSON 格式输出（不要输出其他内容，不要用 markdown 代码块包裹）：

{
  "question": "原题内容（保留公式、符号等，数学公式用 LaTeX 格式 $...$ 包裹）",
  "wrongAnswer": "错误答案（如果图片中能看到的话，否则留空字符串）",
  "correctAnswer": "正确答案（如果图片中能看到的话，否则留空字符串）",
  "analysis": "解题思路或解析（如果图片中能看到的话，否则留空字符串）",
  "subject": "CHINESE 或 MATH 或 ENGLISH（根据题目内容判断科目）",
  "knowledgePoint": "知识点名称（如"一元二次方程"、"阅读理解"等）",
  "errorReason": "可能的错误原因（如果可以推断的话）"
}`,
  };
}

export function buildAnalysisPrompt(error: {
  question: string;
  wrongAnswer: string;
  correctAnswer: string;
  analysis?: string | null;
  errorReason?: string | null;
  subject: string;
}): ChatMessage[] {
  const subjectLabels: Record<string, string> = {
    CHINESE: "语文",
    MATH: "数学",
    ENGLISH: "英语",
  };

  return [
    {
      role: "system",
      content: `你是一位经验丰富的${subjectLabels[error.subject] || ""}老师，擅长分析学生的错误并给出有针对性的学习建议。请用中文回答，格式清晰。

如果回答中包含数学公式，请严格遵守以下格式要求：
1. 行内公式只使用 $...$
2. 独立块级公式只使用 $$...$$
3. 不要使用 \\(...\\) 或 \\[...\\]
4. 不要把公式放进 markdown 代码块
5. 普通文本与公式之间保留自然语义，不要重复输出同一公式`,
    },
    {
      role: "user",
      content: `请分析以下错题，给出：
1. **错误原因分析**：为什么会做错？是知识盲区、审题失误、计算错误还是方法不当？
2. **知识点梳理**：这道题涉及哪些核心知识点？请简要讲解。
3. **解题思路**：给出正确的解题步骤和思路。
4. **举一反三**：出一道类似的变式题（含答案），帮助巩固。
5. **学习建议**：针对这类错误，给出后续学习和复习建议。

---
科目：${subjectLabels[error.subject] || error.subject}
题目：${error.question}
我的答案：${error.wrongAnswer || "暂未填写"}
正确答案：${error.correctAnswer || "暂未订正"}
${error.analysis ? `解析：${error.analysis}` : ""}
${error.errorReason ? `我自述的错误原因：${error.errorReason}` : ""}`,
    },
  ];
}

export function buildSummaryPrompt(errors: {
  question: string;
  wrongAnswer: string;
  correctAnswer: string;
  subject: string;
  knowledgePoint?: { name: string } | null;
}[]): ChatMessage[] {
  const errorsText = errors
    .map(
      (e, i) =>
        `${i + 1}. [${e.subject === "CHINESE" ? "语文" : e.subject === "MATH" ? "数学" : "英语"}] ${e.knowledgePoint ? `【${e.knowledgePoint.name}】` : ""} ${e.question} → 错答: ${e.wrongAnswer} → 正答: ${e.correctAnswer}`
    )
    .join("\n");

  return [
    {
      role: "system",
      content:
        `你是一位善于归纳总结的老师，请根据学生的错题集进行系统性分析和总结归纳。用中文回答，结构清晰。

如果回答中包含数学公式，请严格遵守以下格式要求：
1. 行内公式只使用 $...$
2. 独立块级公式只使用 $$...$$
3. 不要使用 \\(...\\) 或 \\[...\\]
4. 不要把公式放进 markdown 代码块`,
    },
    {
      role: "user",
      content: `以下是我最近的错题集内容，请帮我：
1. **薄弱知识点归类**：将这些错题按知识点归类，找出最薄弱的领域
2. **常见错误模式**：分析我的错误是否有共性问题（如审题、计算、概念理解等）
3. **优先复习建议**：建议我应该先复习哪些内容
4. **学习规划**：给出一个短期（1-2周）的针对性学习计划

---
${errorsText}`,
    },
  ];
}
