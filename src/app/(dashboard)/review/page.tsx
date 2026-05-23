"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SubjectTag } from "@/components/common/subject-tag";
import { MasteryBadge } from "@/components/common/mastery-badge";
import { QuestionContent } from "@/components/common/question-content";
import { format } from "date-fns";
import { ArrowRight } from "lucide-react";
import { DashboardHero, DashboardPage, EmptyStateCard, SectionHeading } from "@/components/layout/dashboard-shell";

interface ReviewItem {
  id: string;
  subject: string;
  question: string;
  masteryLevel: string;
  nextReviewDate: string;
  interval: number;
  knowledgePoint: { id: string; name: string } | null;
}

export default function ReviewPage() {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [total, setTotal] = useState(0);
  const [completed, setCompleted] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/review");
        const data = await res.json();
        setItems(data.items || []);
        setTotal(data.total || 0);
        setCompleted(data.completed || 0);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <DashboardPage>
      <DashboardHero
        eyebrow="复习任务"
        title="按节奏完成今日复盘"
        description="系统会根据掌握情况自动调整复习间隔。今天先处理到期任务，再继续推进新的测试与错题整理。"
        actions={
          <Link href="/review/session">
            <Button disabled={completed >= total || total === 0}>
              <ArrowRight className="mr-1 h-4 w-4" />
              {completed >= total && total > 0 ? "今日已完成" : "开始复习"}
            </Button>
          </Link>
        }
      />

      {loading ? (
        <EmptyStateCard
          title="复习任务加载中"
          description="正在整理今天需要复盘的题目，请稍候。"
        />
      ) : total === 0 ? (
        <EmptyStateCard
          title="今天没有需要复习的错题"
          description="保持学习节奏，新的错题会在合适的时间自动回到你的复习计划里。"
        />
      ) : (
        <>
          <Card>
            <CardContent className="p-5 md:p-6">
              <SectionHeading
                title="今日复习进度"
                description="完成得越及时，后续复习间隔会越合理。"
              />
              <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">已完成 / 总任务</p>
                  <p className="mt-2 text-3xl font-black tracking-[-0.04em] text-slate-950">
                    {completed} / {total}
                  </p>
                </div>
                <Link href="/review/session">
                  <Button disabled={completed >= total}>
                    <ArrowRight className="mr-1 h-4 w-4" />
                    {completed >= total ? "已全部完成" : "进入复习会话"}
                  </Button>
                </Link>
              </div>
              {total > 0 && (
                <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-linear-to-r from-blue-500 via-sky-400 to-emerald-400 transition-all"
                    style={{ width: `${(completed / total) * 100}%` }}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 md:p-6">
              <SectionHeading
                title={`待复习错题（${items.length} 题）`}
                description="优先处理掌握度较低、已经到期的题目。"
              />
              <div className="mt-6 space-y-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-[1.45rem] border border-white/80 bg-slate-50/72 px-5 py-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex items-center gap-2">
                          <SubjectTag subject={item.subject as "CHINESE" | "MATH" | "ENGLISH"} />
                          {item.knowledgePoint ? (
                            <span className="text-xs text-muted-foreground">
                              {item.knowledgePoint.name}
                            </span>
                          ) : null}
                        </div>
                        <QuestionContent
                          content={
                            item.question.length > 96
                              ? `${item.question.slice(0, 96)}...`
                              : item.question
                          }
                          className="line-clamp-2 text-sm leading-7 text-slate-700"
                        />
                      </div>
                      <MasteryBadge
                        level={
                          item.masteryLevel as
                            | "NOT_MASTERED"
                            | "PARTIALLY_MASTERED"
                            | "MASTERED"
                        }
                      />
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">
                      间隔 {item.interval} 天 · 复习日期 {format(new Date(item.nextReviewDate), "MM/dd")}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </DashboardPage>
  );
}
