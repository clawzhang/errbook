import { NextRequest } from "next/server";
import { withApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/lib/errors";
import { calculateSM2 } from "@/lib/sm2";

export const GET = withApiHandler(
  async (_request: NextRequest, { params }) => {
    const userId = (_request as any).user.id;
    const { sessionId } = await params;

    const testSession = await prisma.testSession.findFirst({
      where: { id: sessionId, userId },
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
      throw new NotFoundError("测试");
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

    return {
      ...testSession,
      answers: enrichedAnswers,
    };
  },
  { requireAuth: true }
);

export const POST = withApiHandler(
  async (request: NextRequest, { params }) => {
    const userId = (request as any).user.id;
    const { sessionId } = await params;

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
      where: { id: sessionId, userId },
    });

    if (!testSession) {
      throw new NotFoundError("测试");
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

    return {
      correctCount,
      totalQuestions: testSession.totalQuestions,
      accuracy:
        testSession.totalQuestions > 0
          ? correctCount / testSession.totalQuestions
          : 0,
    };
  },
  { requireAuth: true }
);
