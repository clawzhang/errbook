import { NextRequest } from "next/server";
import { withApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/lib/errors";
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

export const GET = withApiHandler(
  async (_request: NextRequest, { params }) => {
    const userId = (_request as any).user.id;
    const { id } = await params;

    const error = await prisma.error.findFirst({
      where: { id, userId },
      include: {
        knowledgePoint: { select: { id: true, name: true } },
        reviews: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!error) {
      throw new NotFoundError("错题");
    }

    return { error };
  },
  { requireAuth: true }
);

export const PUT = withApiHandler(
  async (request: NextRequest, { params }) => {
    const userId = (request as any).user.id;
    const data = (request as any).validatedBody;
    const { id } = await params;

    const updateData: Record<string, any> = {};

    if (data.subject !== undefined) updateData.subject = data.subject;
    if (data.knowledgePointId !== undefined) {
      updateData.knowledgePointId = data.knowledgePointId;
    }
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
      where: { id, userId },
      data: updateData,
      include: { knowledgePoint: { select: { id: true, name: true } } },
    });

    return { error };
  },
  { requireAuth: true, bodySchema: updateErrorSchema }
);

export const DELETE = withApiHandler(
  async (_request: NextRequest, { params }) => {
    const userId = (_request as any).user.id;
    const { id } = await params;

    await prisma.error.delete({ where: { id, userId } });
    return { success: true };
  },
  { requireAuth: true }
);
