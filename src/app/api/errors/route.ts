import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserCurrentGrade } from "@/lib/grade-server";
import { isQuestionTypeValid } from "@/lib/constants";
import { z } from "zod";

const createErrorSchema = z.object({
  subject: z.enum(["CHINESE", "MATH", "ENGLISH"]),
  questionType: z.string().trim().min(1).nullable().optional(),
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

/** 允许前端指定的排序字段，其余一律回落到 createdAt */
const SORTABLE_FIELDS = [
  "createdAt",
  "updatedAt",
  "nextReviewDate",
  "lastReviewDate",
  "masteryLevel",
  "subject",
] as const;

const DEFAULT_PAGE_SIZE = 20;
// 知识点/科目页会一次性拉取数百条做前端聚合，上限需覆盖该用法
const MAX_PAGE_SIZE = 500;
const MAX_PAGE = 10000;

function isSortableField(
  value: string | null
): value is (typeof SORTABLE_FIELDS)[number] {
  return value !== null && (SORTABLE_FIELDS as readonly string[]).includes(value);
}

/** 解析分页参数，非法值回落默认值并限制上界，避免一次拉取过多数据 */
function parsePositiveInt(
  value: string | null,
  fallback: number,
  max: number
): number {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  try {
    const { searchParams } = request.nextUrl;
    const subject = searchParams.get("subject") || undefined;
    const masteryLevel = searchParams.get("masteryLevel") || undefined;
    const knowledgePointId = searchParams.get("knowledgePointId") || undefined;
    const source = searchParams.get("source") || undefined;
    const needReview = searchParams.get("needReview") === "true";
    const grade = searchParams.get("grade") || undefined;
    const semester = searchParams.get("semester") || undefined;
    const page = parsePositiveInt(searchParams.get("page"), 1, MAX_PAGE);
    const pageSize = parsePositiveInt(
      searchParams.get("pageSize"),
      DEFAULT_PAGE_SIZE,
      MAX_PAGE_SIZE
    );

    // 排序字段必须走白名单，避免非法字段直接透传给 Prisma 触发未捕获异常
    const requestedSort = searchParams.get("sort");
    const sort = isSortableField(requestedSort) ? requestedSort : "createdAt";
    const order = searchParams.get("order") === "asc" ? "asc" : "desc";

    const where: Record<string, unknown> = { userId: session.user.id };

    if (subject) where.subject = subject;
    if (masteryLevel) where.masteryLevel = masteryLevel;
    if (knowledgePointId) where.knowledgePointId = knowledgePointId;
    if (source) where.source = source;
    if (needReview) {
      where.nextReviewDate = { lte: new Date() };
    }
    if (grade) {
      const parsedGrade = Number.parseInt(grade, 10);
      if (Number.isFinite(parsedGrade)) {
        where.grade = parsedGrade;
        if (semester) where.semester = semester;
      }
    }

    const [items, total] = await Promise.all([
      prisma.error.findMany({
        where,
        include: { knowledgePoint: { select: { id: true, name: true } } },
        orderBy: { [sort]: order },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.error.count({ where }),
    ]);

    return NextResponse.json({ items, total, page, pageSize });
  } catch {
    return NextResponse.json({ error: "查询失败" }, { status: 500 });
  }
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
    if (data.questionType && !isQuestionTypeValid(data.subject, data.questionType)) {
      return NextResponse.json({ error: "题目类型与科目不匹配" }, { status: 400 });
    }
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
        questionType: data.questionType || null,
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
