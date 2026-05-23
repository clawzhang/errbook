import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const allowedFilters = [
  "subject",
  "masteryLevel",
  "knowledgePointId",
  "source",
  "grade",
  "semester",
] as const;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { id } = await params;
  const { searchParams } = request.nextUrl;
  const sort = searchParams.get("sort") || "createdAt";
  const order = searchParams.get("order") === "asc" ? "asc" : "desc";
  const where: Record<string, unknown> = { userId: session.user.id };

  for (const key of allowedFilters) {
    const value = searchParams.get(key);
    if (!value) continue;
    where[key] = key === "grade" ? parseInt(value) : value;
  }

  if (searchParams.get("needReview") === "true") {
    where.nextReviewDate = { lte: new Date() };
  }

  const items = await prisma.error.findMany({
    where,
    select: { id: true },
    orderBy: [{ [sort]: order }, { id: order }],
  });

  const index = items.findIndex((item) => item.id === id);
  if (index === -1) {
    return NextResponse.json({ prev: null, next: null });
  }

  return NextResponse.json({
    prev: items[index - 1] || null,
    next: items[index + 1] || null,
  });
}
