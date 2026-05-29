import { NextRequest } from "next/server";
import { withApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { calculateSM2 } from "@/lib/sm2";
import { NotFoundError } from "@/lib/errors";
import { z } from "zod";

const reviewResultSchema = z.object({
  errorId: z.string(),
  quality: z.enum(["AGAIN", "HARD", "GOOD", "EASY"]),
  userAnswer: z.string().nullable().optional(),
});

export const GET = withApiHandler(
  async (request: NextRequest) => {
    const userId = (request as any).user.id;

    const dateParam = request.nextUrl.searchParams.get("date");
    const targetDate = dateParam ? new Date(dateParam) : new Date();
    targetDate.setHours(23, 59, 59, 999);

    const items = await prisma.error.findMany({
      where: {
        userId,
        nextReviewDate: { lte: targetDate },
      },
      include: {
        knowledgePoint: { select: { id: true, name: true } },
      },
      orderBy: { nextReviewDate: "asc" },
    });

    const completedToday = await prisma.review.findMany({
      where: {
        userId,
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
      select: { errorId: true },
    });

    const completedIds = new Set(completedToday.map((r) => r.errorId));

    return {
      total: items.length,
      completed: items.filter((item) => completedIds.has(item.id)).length,
      items,
    };
  },
  { requireAuth: true }
);

export const POST = withApiHandler(
  async (request: NextRequest) => {
    const userId = (request as any).user.id;
    const { errorId, quality, userAnswer } = (request as any).validatedBody;

    const error = await prisma.error.findFirst({
      where: { id: errorId, userId },
    });

    if (!error) {
      throw new NotFoundError("错题");
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
          userId,
          quality,
          userAnswer,
          prevEaseFactor: error.easeFactor,
          prevInterval: error.interval,
          prevRepetitions: error.repetitions,
        },
      }),
    ]);

    return { error: updatedError, review };
  },
  { requireAuth: true, bodySchema: reviewResultSchema }
);
