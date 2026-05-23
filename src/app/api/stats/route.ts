import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { subDays, startOfWeek, startOfMonth, format } from "date-fns";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const period = request.nextUrl.searchParams.get("period") || "month";
  const userId = session.user.id;

  let startDate: Date;
  switch (period) {
    case "week":
      startDate = startOfWeek(new Date(), { weekStartsOn: 1 });
      break;
    case "month":
      startDate = startOfMonth(new Date());
      break;
    case "semester":
      startDate = subDays(new Date(), 120);
      break;
    default:
      startDate = new Date(0);
  }

  const [
    totalErrors,
    masteredCount,
    partiallyMasteredCount,
    notMasteredCount,
    todayReviewCount,
    todayCompletedCount,
    subjectDistribution,
    masteryDistribution,
    reviews,
    errorGrowth,
  ] = await Promise.all([
    prisma.error.count({ where: { userId } }),
    prisma.error.count({
      where: { userId, masteryLevel: "MASTERED" },
    }),
    prisma.error.count({
      where: { userId, masteryLevel: "PARTIALLY_MASTERED" },
    }),
    prisma.error.count({
      where: { userId, masteryLevel: "NOT_MASTERED" },
    }),
    prisma.error.count({
      where: {
        userId,
        nextReviewDate: { lte: new Date() },
      },
    }),
    prisma.review.count({
      where: {
        userId,
        createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    }),
    prisma.error.groupBy({
      by: ["subject"],
      where: { userId },
      _count: { id: true },
    }),
    prisma.error.groupBy({
      by: ["subject", "masteryLevel"],
      where: { userId },
      _count: { id: true },
    }),
    prisma.review.findMany({
      where: {
        userId,
        createdAt: { gte: startDate },
      },
      select: {
        quality: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.error.groupBy({
      by: ["createdAt"],
      where: { userId, createdAt: { gte: startDate } },
      _count: { id: true },
    }),
  ]);

  const accuracyTrend = buildAccuracyTrend(reviews);
  const errorGrowthTrend = buildErrorGrowthTrend(errorGrowth);

  const weakKnowledgePoints = await getWeakKnowledgePoints(userId);

  const subjectLabels: Record<string, string> = {
    CHINESE: "语文",
    MATH: "数学",
    ENGLISH: "英语",
  };

  const masteryLabels: Record<string, string> = {
    NOT_MASTERED: "未掌握",
    PARTIALLY_MASTERED: "部分掌握",
    MASTERED: "已掌握",
  };

  return NextResponse.json({
    summary: {
      totalErrors,
      masteredCount,
      partiallyMasteredCount,
      notMasteredCount,
      todayReviewCount,
      todayCompletedCount,
    },
    subjectDistribution: subjectDistribution.map((s) => ({
      subject: subjectLabels[s.subject] || s.subject,
      count: s._count.id,
    })),
    masteryDistribution: masteryDistribution.map((m) => ({
      subject: subjectLabels[m.subject] || m.subject,
      masteryLevel: masteryLabels[m.masteryLevel] || m.masteryLevel,
      count: m._count.id,
    })),
    accuracyTrend,
    errorGrowthTrend,
    weakKnowledgePoints,
  });
}

function buildAccuracyTrend(
  reviews: { quality: string; createdAt: Date }[]
) {
  if (reviews.length === 0) return [];

  const byDate = new Map<string, { good: number; total: number }>();

  for (const r of reviews) {
    const date = format(r.createdAt, "MM/dd");
    const entry = byDate.get(date) || { good: 0, total: 0 };
    entry.total++;
    if (r.quality === "GOOD" || r.quality === "EASY") entry.good++;
    byDate.set(date, entry);
  }

  return Array.from(byDate.entries()).map(([date, { good, total }]) => ({
    date,
    rate: Math.round((good / total) * 100),
  }));
}

function buildErrorGrowthTrend(
  errorGrowth: { createdAt: Date; _count: { id: number } }[]
) {
  if (errorGrowth.length === 0) return [];

  const byWeek = new Map<string, number>();

  for (const e of errorGrowth) {
    const week = format(e.createdAt, "MM/dd");
    byWeek.set(week, (byWeek.get(week) || 0) + e._count.id);
  }

  return Array.from(byWeek.entries()).map(([date, count]) => ({
    date,
    count,
  }));
}

async function getWeakKnowledgePoints(userId: string) {
  const errorsWithKP = await prisma.error.findMany({
    where: { userId, knowledgePointId: { not: null } },
    select: {
      knowledgePointId: true,
      masteryLevel: true,
      knowledgePoint: { select: { name: true, subject: true } },
    },
  });

  const kpMap = new Map<
    string,
    { name: string; subject: string; scores: number[] }
  >();

  const masteryScore: Record<string, number> = {
    NOT_MASTERED: 0,
    PARTIALLY_MASTERED: 1,
    MASTERED: 2,
  };

  for (const e of errorsWithKP) {
    if (!e.knowledgePointId || !e.knowledgePoint) continue;
    const entry = kpMap.get(e.knowledgePointId) || {
      name: e.knowledgePoint.name,
      subject: e.knowledgePoint.subject,
      scores: [],
    };
    entry.scores.push(masteryScore[e.masteryLevel] ?? 0);
    kpMap.set(e.knowledgePointId, entry);
  }

  const subjectLabels: Record<string, string> = {
    CHINESE: "语文",
    MATH: "数学",
    ENGLISH: "英语",
  };

  return Array.from(kpMap.entries())
    .map(([id, { name, subject, scores }]) => ({
      id,
      name,
      subject: subjectLabels[subject] || subject,
      avgMastery: scores.reduce((a, b) => a + b, 0) / scores.length,
      errorCount: scores.length,
    }))
    .sort((a, b) => a.avgMastery - b.avgMastery)
    .slice(0, 10);
}
