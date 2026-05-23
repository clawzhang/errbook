import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { format, subDays } from "date-fns";
import { getUserCurrentGrade } from "@/lib/grade-server";
import { formatGradeSemester } from "@/lib/grade";
import { SUBJECTS, ERROR_SOURCES } from "@/lib/constants";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const userId = session.user.id;
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const trendStart = subDays(todayStart, 6);

  const [
    gradeInfo,
    totalErrors,
    masteredCount,
    dueCount,
    totalReviews,
    correctReviews,
    recentErrors,
    dueItems,
    recentCompletedReviews,
    subjectDistribution,
    weakKnowledgePoints,
    trendErrors,
    testSessions,
  ] = await Promise.all([
    getUserCurrentGrade(userId),
    prisma.error.count({ where: { userId } }),
    prisma.error.count({ where: { userId, masteryLevel: "MASTERED" } }),
    prisma.error.count({ where: { userId, nextReviewDate: { lte: now } } }),
    prisma.review.count({ where: { userId } }),
    prisma.review.count({
      where: {
        userId,
        quality: { in: ["GOOD", "EASY"] },
      },
    }),
    prisma.error.findMany({
      where: { userId },
      include: { knowledgePoint: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    prisma.error.findMany({
      where: {
        userId,
        nextReviewDate: { lte: now },
      },
      include: { knowledgePoint: { select: { id: true, name: true } } },
      orderBy: [{ nextReviewDate: "asc" }, { createdAt: "desc" }],
      take: 3,
    }),
    prisma.review.findMany({
      where: { userId },
      include: {
        error: {
          select: {
            id: true,
            subject: true,
            question: true,
            knowledgePoint: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    prisma.error.groupBy({
      by: ["subject"],
      where: { userId },
      _count: { id: true },
    }),
    prisma.error.findMany({
      where: { userId, knowledgePointId: { not: null } },
      select: {
        masteryLevel: true,
        knowledgePointId: true,
        knowledgePoint: { select: { id: true, name: true, subject: true } },
      },
    }),
    prisma.error.findMany({
      where: {
        userId,
        createdAt: { gte: trendStart },
      },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.testSession.findMany({
      where: { userId },
      select: {
        id: true,
        title: true,
        totalQuestions: true,
        correctCount: true,
        status: true,
        startedAt: true,
        completedAt: true,
      },
      orderBy: { startedAt: "desc" },
      take: 4,
    }),
  ]);

  const sevenDayTrend = Array.from({ length: 7 }, (_, index) => {
    const date = subDays(todayStart, 6 - index);
    return {
      key: format(date, "yyyy-MM-dd"),
      label: format(date, "MM-dd"),
      count: 0,
    };
  });

  const trendMap = new Map(sevenDayTrend.map((item) => [item.key, item]));
  for (const error of trendErrors) {
    const key = format(error.createdAt, "yyyy-MM-dd");
    const item = trendMap.get(key);
    if (item) item.count += 1;
  }

  const totalDistribution = subjectDistribution.reduce((sum, item) => sum + item._count.id, 0) || 1;
  const subjectCards = subjectDistribution.map((item) => ({
    key: item.subject,
    label: SUBJECTS[item.subject as keyof typeof SUBJECTS]?.label || item.subject,
    count: item._count.id,
    percent: Math.round((item._count.id / totalDistribution) * 100),
  }));

  const masteryScore: Record<string, number> = {
    NOT_MASTERED: 0,
    PARTIALLY_MASTERED: 1,
    MASTERED: 2,
  };

  const knowledgeMap = new Map<
    string,
    { id: string; name: string; subject: string; scores: number[]; total: number }
  >();

  for (const item of weakKnowledgePoints) {
    if (!item.knowledgePointId || !item.knowledgePoint) continue;
    const record = knowledgeMap.get(item.knowledgePointId) || {
      id: item.knowledgePoint.id,
      name: item.knowledgePoint.name,
      subject: item.knowledgePoint.subject,
      scores: [],
      total: 0,
    };
    record.scores.push(masteryScore[item.masteryLevel] ?? 0);
    record.total += 1;
    knowledgeMap.set(item.knowledgePointId, record);
  }

  const knowledgeProgress = Array.from(knowledgeMap.values())
    .map((item) => {
      const avg = item.scores.reduce((sum, score) => sum + score, 0) / item.scores.length;
      return {
        id: item.id,
        label: item.name,
        subject: SUBJECTS[item.subject as keyof typeof SUBJECTS]?.label || item.subject,
        percent: Math.round((avg / 2) * 100),
        total: item.total,
      };
    })
    .sort((a, b) => a.percent - b.percent || b.total - a.total)
    .slice(0, 5);

  const currentStage = formatGradeSemester(gradeInfo.grade, gradeInfo.semester);
  const reviewAccuracy = totalReviews > 0 ? Math.round((correctReviews / totalReviews) * 100) : 0;
  const todayReviewCount = dueItems.length;
  const completedTodayCount = await prisma.review.count({
    where: {
      userId,
      createdAt: { gte: todayStart },
    },
  });

  return NextResponse.json({
    greeting: {
      name: session.user.name || "学习小能手",
      currentDateLabel: format(now, "yyyy年M月d日"),
      weekdayLabel: `星期${"日一二三四五六"[now.getDay()]}`,
      currentStage,
    },
    summary: {
      totalErrors,
      masteredCount,
      dueCount,
      reviewAccuracy,
      todayReviewCount,
      completedTodayCount,
      totalTests: testSessions.length,
    },
    trend: sevenDayTrend.map(({ label, count }) => ({ label, count })),
    knowledgeProgress,
    subjectDistribution: subjectCards,
    recentErrors: recentErrors.map((item) => ({
      id: item.id,
      subject: item.subject,
      question: item.question,
      source: item.source,
      sourceLabel: ERROR_SOURCES[item.source as keyof typeof ERROR_SOURCES]?.label || item.source,
      sourceDetail: item.sourceDetail,
      createdAt: item.createdAt,
      knowledgePoint: item.knowledgePoint,
    })),
    recentReview: dueItems.map((item) => ({
      id: item.id,
      subject: item.subject,
      question: item.question,
      nextReviewDate: item.nextReviewDate,
      masteryLevel: item.masteryLevel,
      knowledgePoint: item.knowledgePoint,
    })),
    completedReview: recentCompletedReviews.map((item) => ({
      id: item.id,
      createdAt: item.createdAt,
      quality: item.quality,
      error: item.error,
    })),
    recentTests: testSessions,
  });
}
