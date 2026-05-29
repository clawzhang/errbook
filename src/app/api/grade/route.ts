import { NextRequest } from "next/server";
import { withApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/lib/errors";
import { computeCurrentGrade, formatGradeSemester } from "@/lib/grade";
import { z } from "zod";

const gradeConfigSchema = z.object({
  currentGrade: z.number().min(1).max(12),
  currentSemester: z.enum(["FIRST", "SECOND"]),
  autoAdvance: z.boolean().default(true),
});

export const GET = withApiHandler(
  async (request: NextRequest) => {
    const userId = (request as any).user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        currentGrade: true,
        currentSemester: true,
        gradeSetAt: true,
        autoAdvance: true,
      },
    });

    if (!user) {
      throw new NotFoundError("用户");
    }

    const baseGrade = user.currentGrade;
    const baseSemester = user.currentSemester as "FIRST" | "SECOND";
    const actual = user.autoAdvance
      ? computeCurrentGrade(baseGrade, baseSemester, user.gradeSetAt)
      : { grade: baseGrade, semester: baseSemester };

    return {
      baseGrade,
      baseSemester,
      gradeSetAt: user.gradeSetAt.toISOString(),
      autoAdvance: user.autoAdvance,
      // 当前实际值仅用于展示，不作为表单回填值
      currentGrade: actual.grade,
      currentSemester: actual.semester,
      currentLabel: formatGradeSemester(actual.grade, actual.semester),
    };
  },
  { requireAuth: true }
);

export const PUT = withApiHandler(
  async (request: NextRequest) => {
    const userId = (request as any).user.id;
    const { currentGrade, currentSemester, autoAdvance } = (request as any).validatedBody;

    await prisma.user.update({
      where: { id: userId },
      data: {
        currentGrade,
        currentSemester,
        autoAdvance,
        gradeSetAt: new Date(), // 重新设置基准日期为当前
      },
    });

    return {
      success: true,
      baseGrade: currentGrade,
      baseSemester: currentSemester,
      autoAdvance,
      gradeSetAt: new Date().toISOString(),
      currentLabel: formatGradeSemester(currentGrade, currentSemester),
    };
  },
  { requireAuth: true, bodySchema: gradeConfigSchema }
);
