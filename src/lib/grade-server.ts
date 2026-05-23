import { prisma } from "@/lib/prisma";
import { computeCurrentGrade, type GradeInfo, type Semester } from "./grade";

/**
 * 获取用户当前的年级学期（考虑自动晋级）
 * 仅在服务端 API 路由中使用，不能在客户端组件中使用
 */
export async function getUserCurrentGrade(userId: string): Promise<GradeInfo> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      currentGrade: true,
      currentSemester: true,
      gradeSetAt: true,
      autoAdvance: true,
    },
  });

  if (!user) return { grade: 1, semester: "FIRST" };

  if (user.autoAdvance) {
    return computeCurrentGrade(
      user.currentGrade,
      user.currentSemester as Semester,
      user.gradeSetAt
    );
  }

  return {
    grade: user.currentGrade,
    semester: user.currentSemester as Semester,
  };
}
