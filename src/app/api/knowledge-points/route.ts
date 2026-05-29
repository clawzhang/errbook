import { NextRequest } from "next/server";
import { withApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { NotFoundError, ValidationError, ConflictError } from "@/lib/errors";
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

export const GET = withApiHandler(
  async (request: NextRequest) => {
    const subject = request.nextUrl.searchParams.get("subject");
    if (!subject) {
      throw new ValidationError("缺少科目参数");
    }

    const points = await prisma.knowledgePoint.findMany({
      where: {
        subject: subject as "CHINESE" | "MATH" | "ENGLISH",
        parentId: null,
      },
      include: { children: { orderBy: { sortOrder: "asc" } } },
      orderBy: { sortOrder: "asc" },
    });

    return points;
  },
  { requireAuth: true }
);

export const POST = withApiHandler(
  async (request: NextRequest) => {
    const { subject, name, parentId } = (request as any).validatedBody;

    const point = await prisma.knowledgePoint.upsert({
      where: { subject_name: { subject, name } },
      create: {
        subject,
        name,
        parentId: parentId || null,
      },
      update: {},
    });

    return point;
  },
  { requireAuth: true, bodySchema: createKnowledgePointSchema }
);

export const DELETE = withApiHandler(
  async (request: NextRequest) => {
    const id = request.nextUrl.searchParams.get("id");
    if (!id) {
      throw new ValidationError("缺少知识点 ID");
    }

    const point = await prisma.knowledgePoint.findUnique({
      where: { id },
      include: { children: { select: { id: true } } },
    });

    if (!point) {
      throw new NotFoundError("知识点");
    }

    if (point.children.length > 0) {
      throw new ValidationError("该知识点下有子知识点，请先删除子知识点");
    }

    await prisma.$transaction([
      prisma.error.updateMany({
        where: { knowledgePointId: id },
        data: { knowledgePointId: null },
      }),
      prisma.knowledgePoint.delete({ where: { id } }),
    ]);

    return { success: true };
  },
  { requireAuth: true }
);

export const PUT = withApiHandler(
  async (request: NextRequest) => {
    const data = (request as any).validatedBody;

    const existing = await prisma.knowledgePoint.findUnique({
      where: { id: data.id },
    });

    if (!existing) {
      throw new NotFoundError("知识点");
    }

    const duplicate = await prisma.knowledgePoint.findUnique({
      where: {
        subject_name: {
          subject: existing.subject,
          name: data.name,
        },
      },
    });

    if (duplicate && duplicate.id !== existing.id) {
      throw new ConflictError("同学科下已存在该知识点");
    }

    const point = await prisma.knowledgePoint.update({
      where: { id: existing.id },
      data: { name: data.name },
    });

    return point;
  },
  { requireAuth: true, bodySchema: updateKnowledgePointSchema }
);
