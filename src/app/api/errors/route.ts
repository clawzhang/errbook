import { NextRequest } from "next/server";
import { withApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { getUserCurrentGrade } from "@/lib/grade-server";
import { z } from "zod";

const createErrorSchema = z.object({
  subject: z.enum(["CHINESE", "MATH", "ENGLISH"]),
  knowledgePointId: z.string().nullable().optional(),
  knowledgePointName: z.string().trim().nullable().optional(),
  question: z.string().min(1, "题目内容不能为空"),
  questionImages: z.array(z.string()).default([]),
  wrongAnswer: z.string().optional().default(""),
  correctAnswer: z.string().optional().default(""),
  analysis: z.string().nullable().optional(),
  errorReason: z.string().nullable().optional(),
  source: z.enum(["EXAM", "HOMEWORK", "CLASS", "OTHER"]).default("HOMEWORK"),
  sourceDetail: z.string().nullable().optional(),
});

export const GET = withApiHandler(
  async (request: NextRequest) => {
    const userId = (request as any).user.id;
    const { searchParams } = request.nextUrl;

    const subject = searchParams.get("subject") || undefined;
    const masteryLevel = searchParams.get("masteryLevel") || undefined;
    const knowledgePointId = searchParams.get("knowledgePointId") || undefined;
    const source = searchParams.get("source") || undefined;
    const needReview = searchParams.get("needReview") === "true";
    const grade = searchParams.get("grade") || undefined;
    const semester = searchParams.get("semester") || undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const sort = searchParams.get("sort") || "createdAt";
    const order = searchParams.get("order") || "desc";

    const where: Record<string, any> = { userId };

    if (subject) where.subject = subject as any;
    if (masteryLevel) where.masteryLevel = parseInt(masteryLevel);
    if (knowledgePointId) where.knowledgePointId = knowledgePointId;
    if (source) where.source = source as any;
    if (needReview) {
      where.nextReviewDate = { lte: new Date() };
    }
    if (grade) {
      where.grade = parseInt(grade);
      if (semester) where.semester = semester as any;
    }

    const [items, total] = await Promise.all([
      prisma.error.findMany({
        where,
        include: { knowledgePoint: { select: { id: true, name: true } } },
        orderBy: { [sort]: order === "asc" ? "asc" : "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.error.count({ where }),
    ]);

    return { items, total, page, pageSize };
  },
  { requireAuth: true }
);

export const POST = withApiHandler(
  async (request: NextRequest) => {
    const userId = (request as any).user.id;
    const data = (request as any).validatedBody;

    const currentGrade = await getUserCurrentGrade(userId);
    const knowledgePointId =
      data.knowledgePointId ||
      (
        await prisma.knowledgePoint.upsert({
          where: {
            subject_name: {
              subject: data.subject,
              name: data.knowledgePointName || "其他",
            },
          },
          create: {
            subject: data.subject,
            name: data.knowledgePointName || "其他",
          },
          update: {},
          select: { id: true },
        })
      ).id;

    const error = await prisma.error.create({
      data: {
        userId,
        subject: data.subject,
        knowledgePointId,
        grade: currentGrade.grade,
        semester: currentGrade.semester,
        question: data.question,
        questionImages: JSON.stringify(data.questionImages),
        wrongAnswer: data.wrongAnswer,
        correctAnswer: data.correctAnswer,
        analysis: data.analysis,
        errorReason: data.errorReason,
        source: data.source,
        sourceDetail: data.sourceDetail,
      },
      include: { knowledgePoint: { select: { id: true, name: true } } },
    });

    return { error };
  },
  { requireAuth: true, bodySchema: createErrorSchema }
);
