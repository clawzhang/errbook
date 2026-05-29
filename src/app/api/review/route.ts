import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateSM2 } from "@/lib/sm2";
import { z } from "zod";

const reviewResultSchema = z.object({
  errorId: z.string(),
  quality: z.enum(["AGAIN", "HARD", "GOOD", "EASY"]),
  userAnswer: z.string().nullable().optional(),
});

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const dateParam = request.nextUrl.searchParams.get("date");
  const targetDate = dateParam ? new Date(dateParam) : new Date();
  targetDate.setHours(23, 59, 59, 999);

  const items = await prisma.error.findMany({
    where: {
      userId: session.user.id,
      nextReviewDate: { lte: targetDate },
    },
    include: {
      knowledgePoint: { select: { id: true, name: true } },
    },
    orderBy: { nextReviewDate: "asc" },
  });

  const completedToday = await prisma.review.findMany({
    where: {
      userId: session.user.id,
      createdAt: {
        gte: new Date(new Date().setHours(0, 0, 0, 0)),
      },
    },
    select: { errorId: true },
  });

  const completedIds = new Set(completedToday.map((r) => r.errorId));

  return NextResponse.json({
    total: items.length,
    completed: items.filter((item) => completedIds.has(item.id)).length,
    items,
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const result = reviewResultSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: "参数错误" }, { status: 400 });
    }

    const { errorId, quality, userAnswer } = result.data;

    const error = await prisma.error.findFirst({
      where: { id: errorId, userId: session.user.id },
    });

    if (!error) {
      return NextResponse.json({ error: "未找到该错题" }, { status: 404 });
    }

    const sm2Result = calculateSM2(
      {
        easeFactor: error.easeFactor,
        interval: error.interval,
        repetitions: error.repetitions,
      },
      quality
    );

    const [updatedError, review] = await prisma.$transaction([
      prisma.error.update({
        where: { id: errorId },
        data: {
          easeFactor: sm2Result.easeFactor,
          interval: sm2Result.interval,
          repetitions: sm2Result.repetitions,
          nextReviewDate: sm2Result.nextReviewDate,
          masteryLevel: sm2Result.masteryLevel,
          lastReviewDate: new Date(),
        },
        include: { knowledgePoint: { select: { id: true, name: true } } },
      }),
      prisma.review.create({
        data: {
          errorId,
          userId: session.user.id,
          quality,
          userAnswer,
          prevEaseFactor: error.easeFactor,
          prevInterval: error.interval,
          prevRepetitions: error.repetitions,
        },
      }),
    ]);

    return NextResponse.json({ error: updatedError, review });
  } catch {
    return NextResponse.json({ error: "提交失败" }, { status: 500 });
  }
}
