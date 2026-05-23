import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeCurrentGrade, formatGradeSemester } from "@/lib/grade";
import { z } from "zod";

const gradeConfigSchema = z.object({
  currentGrade: z.number().min(1).max(12),
  currentSemester: z.enum(["FIRST", "SECOND"]),
  autoAdvance: z.boolean().default(true),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      currentGrade: true,
      currentSemester: true,
      gradeSetAt: true,
      autoAdvance: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "用户不存在" }, { status: 404 });
  }

  const baseGrade = user.currentGrade;
  const baseSemester = user.currentSemester as "FIRST" | "SECOND";
  const actual = user.autoAdvance
    ? computeCurrentGrade(baseGrade, baseSemester, user.gradeSetAt)
    : { grade: baseGrade, semester: baseSemester };

  return NextResponse.json({
    baseGrade,
    baseSemester,
    gradeSetAt: user.gradeSetAt.toISOString(),
    autoAdvance: user.autoAdvance,
    // 当前实际值仅用于展示，不作为表单回填值
    currentGrade: actual.grade,
    currentSemester: actual.semester,
    currentLabel: formatGradeSemester(actual.grade, actual.semester),
  });
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const result = gradeConfigSchema.safeParse(body);

    if (!result.success) {
      console.error("Grade validation error:", result.error.flatten());
      const firstError =
        Object.values(result.error.flatten().fieldErrors)[0]?.[0] ||
        "参数错误";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { currentGrade, currentSemester, autoAdvance } = result.data;

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        currentGrade,
        currentSemester,
        autoAdvance,
        gradeSetAt: new Date(), // 重新设置基准日期为当前
      },
    });

    return NextResponse.json({
      success: true,
      baseGrade: currentGrade,
      baseSemester: currentSemester,
      autoAdvance,
      gradeSetAt: new Date().toISOString(),
      currentLabel: formatGradeSemester(currentGrade, currentSemester),
    });
  } catch {
    return NextResponse.json({ error: "保存失败" }, { status: 500 });
  }
}
