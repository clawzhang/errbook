import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateSM2 } from "@/lib/sm2";

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
    const { answers } = body as {
      answers: {
        answerId: string;
        userAnswer: string;
        isCorrect: boolean;
        timeSpent?: number;
      }[];
    };

    const testSession = await prisma.testSession.findFirst({
      where: { id: sessionId, userId: session.user.id },
    });

    if (!testSession) {
      return NextResponse.json({ error: "未找到测试" }, { status: 404 });
    }

    const correctCount = answers.filter((a) => a.isCorrect).length;

    await prisma.$transaction([
      ...answers.map((answer) =>
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
          completedAt: new Date(),
        },
      }),
    ]);

    const wrongAnswerIds = answers
      .filter((a) => !a.isCorrect)
      .map((a) => a.answerId);

    if (wrongAnswerIds.length > 0) {
      const wrongAnswers = await prisma.testAnswer.findMany({
        where: { id: { in: wrongAnswerIds } },
        include: { error: true },
      });

      await Promise.all(
        wrongAnswers.map((wa) => {
          const sm2Result = calculateSM2(
            {
              easeFactor: wa.error.easeFactor,
              interval: wa.error.interval,
              repetitions: wa.error.repetitions,
            },
            "AGAIN"
          );

          return prisma.error.update({
            where: { id: wa.errorId },
            data: {
              easeFactor: sm2Result.easeFactor,
              interval: sm2Result.interval,
              repetitions: sm2Result.repetitions,
              nextReviewDate: sm2Result.nextReviewDate,
              masteryLevel: sm2Result.masteryLevel,
              lastReviewDate: new Date(),
            },
          });
        })
      );
    }

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
