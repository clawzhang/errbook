import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserAIConfig, callAI, buildAnalysisPrompt } from "@/lib/ai";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id } = await params;

  const error = await prisma.error.findFirst({
    where: { id, userId: session.user.id },
    include: { knowledgePoint: { select: { name: true } } },
  });

  if (!error) {
    return NextResponse.json({ error: "未找到错题" }, { status: 404 });
  }

  try {
    const messages = buildAnalysisPrompt({
      question: error.question,
      wrongAnswer: error.wrongAnswer,
      correctAnswer: error.correctAnswer,
      analysis: error.analysis,
      errorReason: error.errorReason,
      subject: error.subject,
    });

    const result = await callAI(config, messages);

    return NextResponse.json({ analysis: result, saved: false });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "分析失败";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
