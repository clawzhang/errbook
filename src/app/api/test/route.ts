import { NextRequest } from "next/server";
import { withApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { ValidationError } from "@/lib/errors";
import { z } from "zod";

const createTestSchema = z.object({
  subject: z.enum(["CHINESE", "MATH", "ENGLISH"]),
  knowledgePointIds: z.array(z.string()).optional().default([]),
  masteryLevels: z
    .array(z.enum(["NOT_MASTERED", "PARTIALLY_MASTERED", "MASTERED"]))
    .optional()
    .default([]),
  count: z.number().min(1).max(50).default(10),
  mode: z.enum(["RANDOM", "WEAKEST"]).default("RANDOM"),
});

export const POST = withApiHandler(
  async (request: NextRequest) => {
    const userId = (request as any).user.id;
    const { subject, knowledgePointIds, masteryLevels, count, mode } = (request as any).validatedBody;

    const where: Record<string, any> = {
      userId,
      subject,
    };

    if (knowledgePointIds.length > 0) {
      where.knowledgePointId = { in: knowledgePointIds };
    }
    if (masteryLevels.length > 0) {
      where.masteryLevel = { in: masteryLevels };
    }

    const candidates = await prisma.error.findMany({ where });

    if (candidates.length === 0) {
      throw new ValidationError("没有符合条件的错题");
    }

    let selected = candidates;
    if (mode === "WEAKEST") {
      const order: Record<string, number> = {
        NOT_MASTERED: 0,
        PARTIALLY_MASTERED: 1,
        MASTERED: 2,
      };
      selected = [...candidates].sort(
        (a, b) => order[a.masteryLevel] - order[b.masteryLevel]
      );
    } else {
      for (let i = selected.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [selected[i], selected[j]] = [selected[j], selected[i]];
      }
    }

    selected = selected.slice(0, Math.min(count, selected.length));

    const subjectLabels: Record<string, string> = {
      CHINESE: "语文",
      MATH: "数学",
      ENGLISH: "英语",
    };

    const testSession = await prisma.testSession.create({
      data: {
        userId,
        title: `${subjectLabels[subject]}错题测试`,
        config: JSON.stringify({
          subject,
          knowledgePointIds,
          masteryLevels,
          count,
          mode,
        }),
        totalQuestions: selected.length,
        answers: {
          create: selected.map((error) => ({
            errorId: error.id,
          })),
        },
      },
      include: {
        answers: {
          include: {
            error: {
              select: {
                id: true,
                question: true,
                questionImages: true,
                subject: true,
              },
            },
          },
        },
      },
    });

    return {
      sessionId: testSession.id,
      totalQuestions: testSession.totalQuestions,
    };
  },
  { requireAuth: true, bodySchema: createTestSchema }
);
