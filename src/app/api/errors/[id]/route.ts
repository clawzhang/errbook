import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateErrorSchema = z.object({
  subject: z.enum(["CHINESE", "MATH", "ENGLISH"]).optional(),
  knowledgePointId: z.string().nullable().optional(),
  question: z.string().min(1).optional(),
  questionImages: z.array(z.string()).optional(),
  wrongAnswer: z.string().optional(),
  correctAnswer: z.string().optional(),
  analysis: z.string().nullable().optional(),
  errorReason: z.string().nullable().optional(),
  source: z.enum(["EXAM", "HOMEWORK", "CLASS", "OTHER"]).optional(),
  sourceDetail: z.string().nullable().optional(),
  masteryLevel: z.enum(["NOT_MASTERED", "PARTIALLY_MASTERED", "MASTERED"]).optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { id } = await params;
  const error = await prisma.error.findFirst({
    where: { id, userId: session.user.id },
    include: {
      knowledgePoint: { select: { id: true, name: true } },
      reviews: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!error) {
    return NextResponse.json({ error: "未找到该错题" }, { status: 404 });
  }

  return NextResponse.json({ error });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const result = updateErrorSchema.safeParse(body);

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      const firstError = Object.values(errors)[0]?.[0] || "输入信息有误";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const data = result.data;
    const updateData: Record<string, unknown> = {};

    if (data.subject !== undefined) updateData.subject = data.subject;
    if (data.knowledgePointId !== undefined) updateData.knowledgePointId = data.knowledgePointId;
    if (data.question !== undefined) updateData.question = data.question;
    if (data.questionImages !== undefined) updateData.questionImages = JSON.stringify(data.questionImages);
    if (data.wrongAnswer !== undefined) updateData.wrongAnswer = data.wrongAnswer;
    if (data.correctAnswer !== undefined) updateData.correctAnswer = data.correctAnswer;
    if (data.analysis !== undefined) updateData.analysis = data.analysis;
    if (data.errorReason !== undefined) updateData.errorReason = data.errorReason;
    if (data.source !== undefined) updateData.source = data.source;
    if (data.sourceDetail !== undefined) updateData.sourceDetail = data.sourceDetail;
    if (data.masteryLevel !== undefined) {
      updateData.masteryLevel = data.masteryLevel;
      if (data.masteryLevel === "MASTERED") {
        const next = new Date();
        next.setDate(next.getDate() + 30);
        updateData.nextReviewDate = next;
      } else if (data.masteryLevel === "NOT_MASTERED") {
        updateData.interval = 1;
        const next = new Date();
        next.setDate(next.getDate() + 1);
        updateData.nextReviewDate = next;
      }
    }

    const error = await prisma.error.update({
      where: { id, userId: session.user.id },
      data: updateData,
      include: { knowledgePoint: { select: { id: true, name: true } } },
    });

    return NextResponse.json({ error });
  } catch {
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await prisma.error.delete({ where: { id, userId: session.user.id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}
