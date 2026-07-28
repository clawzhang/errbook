import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateSM2 } from "@/lib/sm2";
import { z } from "zod";

const submitAnswersSchema = z.object({
  answers: z
    .array(
      z.object({
        answerId: z.string().min(1),
        userAnswer: z.string(),
        isCorrect: z.boolean(),
        timeSpent: z.number().int().nonnegative().optional(),
      })
    )
    .min(1, "缺少答案数据"),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { sessionId } = await params;

  const testSession = await prisma.testSession.findFirst({
    where: { id: sessionId, userId: session.user.id },
    include: {
      answers: {
        include: {
          error: {
            select: {
              id: true,
              question: true,
              questionImages: true,
              wrongAnswer: true,
              correctAnswer: true,
              analysis: true,
              subject: true,
            },
          },
        },
      },
    },
  });

  if (!testSession) {
    return NextResponse.json({ error: "未找到测试" }, { status: 404 });
  }

  const errorIds = testSession.answers.map((a) => a.errorId);
  const wrongCounts = await prisma.testAnswer.groupBy({
    by: ["errorId"],
    where: {
      errorId: { in: errorIds },
      isCorrect: false,
    },
    _count: { errorId: true },
  });

  const wrongCountMap = Object.fromEntries(
    wrongCounts.map((wc) => [wc.errorId, wc._count.errorId])
  );

  const enrichedAnswers = testSession.answers.map((a) => ({
    ...a,
    repeatWrongCount: wrongCountMap[a.errorId] || 0,
  }));

  return NextResponse.json({
    ...testSession,
    answers: enrichedAnswers,
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { sessionId } = await params;

  try {
    const body = await request.json();
    const parsed = submitAnswersSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "答案数据格式有误" }, { status: 400 });
    }

    const { answers } = parsed.data;

    const testSession = await prisma.testSession.findFirst({
      where: { id: sessionId, userId: session.user.id },
    });

    if (!testSession) {
      return NextResponse.json({ error: "未找到测试" }, { status: 404 });
    }

    // 仅接受确实属于本次测试的答题记录，避免通过伪造 answerId 篡改他人数据
    const ownedAnswers = await prisma.testAnswer.findMany({
      where: {
        id: { in: answers.map((a) => a.answerId) },
        testSessionId: sessionId,
      },
      include: { error: true },
    });

    const ownedAnswerMap = new Map(ownedAnswers.map((a) => [a.id, a]));
    const acceptedAnswers = answers.filter((a) => ownedAnswerMap.has(a.answerId));

    if (acceptedAnswers.length !== answers.length) {
      return NextResponse.json(
        { error: "答案数据与本次测试不匹配" },
        { status: 400 }
      );
    }

    const correctCount = acceptedAnswers.filter((a) => a.isCorrect).length;
    const now = new Date();

    // 答题记录、测试状态与错题复习进度必须原子更新，避免中途失败留下脏数据
    await prisma.$transaction([
      ...acceptedAnswers.map((answer) =>
        prisma.testAnswer.update({
          where: { id: answer.answerId },
          data: {
            userAnswer: answer.userAnswer,
            isCorrect: answer.isCorrect,
            timeSpent: answer.timeSpent,
          },
        })
      ),
      prisma.testSession.update({
        where: { id: sessionId },
        data: {
          status: "COMPLETED",
          correctCount,
          completedAt: now,
        },
      }),
      ...acceptedAnswers
        .filter((a) => !a.isCorrect)
        .map((answer) => {
          const record = ownedAnswerMap.get(answer.answerId)!;
          const sm2Result = calculateSM2(
            {
              easeFactor: record.error.easeFactor,
              interval: record.error.interval,
              repetitions: record.error.repetitions,
            },
            "AGAIN"
          );

          return prisma.error.update({
            where: { id: record.errorId },
            data: {
              easeFactor: sm2Result.easeFactor,
              interval: sm2Result.interval,
              repetitions: sm2Result.repetitions,
              nextReviewDate: sm2Result.nextReviewDate,
              masteryLevel: sm2Result.masteryLevel,
              lastReviewDate: now,
            },
          });
        }),
    ]);

    return NextResponse.json({
      correctCount,
      totalQuestions: testSession.totalQuestions,
      accuracy:
        testSession.totalQuestions > 0
          ? correctCount / testSession.totalQuestions
          : 0,
    });
  } catch {
    return NextResponse.json({ error: "提交失败" }, { status: 500 });
  }
}
