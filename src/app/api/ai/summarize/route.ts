import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserAIConfig, callAI, buildSummaryPrompt } from "@/lib/ai";
import { z } from "zod";

const summarySchema = z.object({
  subject: z.enum(["CHINESE", "MATH", "ENGLISH"]).optional(),
  limit: z.number().min(5).max(50).default(20),
});

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
    const body = await request.json().catch(() => ({}));
    const { subject, limit } = summarySchema.parse(body);

    const where: Record<string, unknown> = { userId: session.user.id };
    if (subject) where.subject = subject;

    const errors = await prisma.error.findMany({
      where,
      include: { knowledgePoint: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    if (errors.length === 0) {
      return NextResponse.json({ error: "没有错题可供总结" }, { status: 400 });
    }

    const messages = buildSummaryPrompt(
      errors.map((e) => ({
        question: e.question,
        wrongAnswer: e.wrongAnswer,
        correctAnswer: e.correctAnswer,
        subject: e.subject,
        knowledgePoint: e.knowledgePoint,
      }))
    );

    const result = await callAI(config, messages, { maxTokens: 3000 });
    return NextResponse.json({ summary: result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "总结失败";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
