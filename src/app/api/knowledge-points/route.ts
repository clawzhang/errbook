import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const subjectSchema = z.enum(["CHINESE", "MATH", "ENGLISH"]);

const createKnowledgePointSchema = z.object({
  subject: subjectSchema,
  name: z.string().trim().min(1, "知识点名称不能为空"),
  parentId: z.string().nullable().optional(),
});

const updateKnowledgePointSchema = z.object({
  id: z.string().min(1, "缺少知识点 ID"),
  name: z.string().trim().min(1, "知识点名称不能为空"),
});

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const subject = request.nextUrl.searchParams.get("subject");
  if (!subject) {
    return NextResponse.json({ error: "缺少科目参数" }, { status: 400 });
  }

  const points = await prisma.knowledgePoint.findMany({
    where: {
      subject: subject as "CHINESE" | "MATH" | "ENGLISH",
      parentId: null,
    },
    include: { children: { orderBy: { sortOrder: "asc" } } },
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json(points);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const result = createKnowledgePointSchema.safeParse(body);

    if (!result.success) {
      const firstError =
        Object.values(result.error.flatten().fieldErrors)[0]?.[0] ||
        "输入信息有误";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { subject, name, parentId } = result.data;
    const point = await prisma.knowledgePoint.upsert({
      where: { subject_name: { subject, name } },
      create: {
        subject,
        name,
        parentId: parentId || null,
      },
      update: {},
    });

    return NextResponse.json(point, { status: 201 });
  } catch {
    return NextResponse.json({ error: "创建知识点失败" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const result = updateKnowledgePointSchema.safeParse(body);

    if (!result.success) {
      const firstError =
        Object.values(result.error.flatten().fieldErrors)[0]?.[0] ||
        "输入信息有误";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const existing = await prisma.knowledgePoint.findUnique({
      where: { id: result.data.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "知识点不存在" }, { status: 404 });
    }

    const duplicate = await prisma.knowledgePoint.findUnique({
      where: {
        subject_name: {
          subject: existing.subject,
          name: result.data.name,
        },
      },
    });

    if (duplicate && duplicate.id !== existing.id) {
      return NextResponse.json({ error: "同学科下已存在该知识点" }, { status: 400 });
    }

    const point = await prisma.knowledgePoint.update({
      where: { id: existing.id },
      data: { name: result.data.name },
    });

    return NextResponse.json(point);
  } catch {
    return NextResponse.json({ error: "更新知识点失败" }, { status: 500 });
  }
}
