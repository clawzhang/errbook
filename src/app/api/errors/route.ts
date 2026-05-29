import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
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

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

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

  const where: Record<string, unknown> = { userId: session.user.id };

  if (subject) where.subject = subject;
  if (masteryLevel) where.masteryLevel = masteryLevel;
  if (knowledgePointId) where.knowledgePointId = knowledgePointId;
  if (source) where.source = source;
  if (needReview) {
    where.nextReviewDate = { lte: new Date() };
  }
  if (grade) {
    where.grade = parseInt(grade);
    if (semester) where.semester = semester;
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

  return NextResponse.json({ items, total, page, pageSize });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const result = createErrorSchema.safeParse(body);

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      const firstError = Object.values(errors)[0]?.[0] || "输入信息有误";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const data = result.data;
    const currentGrade = await getUserCurrentGrade(session.user.id);
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
        userId: session.user.id,
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

    return NextResponse.json({ error }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "创建失败" }, { status: 500 });
  }
}
