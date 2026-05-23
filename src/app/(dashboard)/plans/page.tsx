"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { DashboardHero, DashboardPage, SectionHeading } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SubjectTag } from "@/components/common/subject-tag";
import { QuestionContent } from "@/components/common/question-content";

interface ReviewItem {
  id: string;
  subject: string;
  question: string;
  nextReviewDate: string;
  knowledgePoint?: { id: string; name: string } | null;
}

export default function PlansPage() {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/review");
        const data = await res.json();
        setItems(data.items || []);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const today = items.filter((item) => new Date(item.nextReviewDate) <= new Date());
  const upcoming = items.filter((item) => new Date(item.nextReviewDate) > new Date()).slice(0, 6);

  return (
    <DashboardPage>
      <DashboardHero
        eyebrow="复习计划"
        title="按节奏安排复习任务"
        description="这里基于现有复习调度结果生成今日待办和即将到期任务，第一版不提供手工编排计划，而是强调执行视图。"
        actions={
          <Link href="/review">
            <Button>进入复习主页</Button>
          </Link>
        }
      />

      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardContent className="p-5 md:p-6">
            <SectionHeading
              title="今日待复习"
              description="优先完成今天到期和已经逾期的错题。"
            />
            <div className="mt-6 space-y-4">
              {loading ? (
                <p className="text-sm text-muted-foreground">正在加载复习计划...</p>
              ) : today.length ? (
                today.map((item) => (
                  <Link
                    key={item.id}
                    href="/review"
                    className="block rounded-[1.4rem] border border-white/80 bg-slate-50/72 px-5 py-4"
                  >
                    <div className="flex items-center gap-2">
                      <SubjectTag subject={item.subject} />
                      {item.knowledgePoint ? (
                        <span className="text-xs text-slate-400">{item.knowledgePoint.name}</span>
                      ) : null}
                    </div>
                    <QuestionContent
                      content={item.question}
                      className="mt-3 line-clamp-2 text-sm leading-7 text-slate-700"
                    />
                    <p className="mt-3 text-xs text-slate-400">
                      计划时间：{format(new Date(item.nextReviewDate), "MM-dd HH:mm")}
                    </p>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">今天没有到期的复习任务。</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 md:p-6">
            <SectionHeading
              title="即将到期"
              description="提前观察后续几道需要进入复盘节奏的题目。"
            />
            <div className="mt-6 space-y-4">
              {loading ? (
                <p className="text-sm text-muted-foreground">正在整理后续任务...</p>
              ) : upcoming.length ? (
                upcoming.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-[1.4rem] border border-white/80 bg-slate-50/72 px-5 py-4"
                  >
                    <div className="flex items-center gap-2">
                      <SubjectTag subject={item.subject} />
                      {item.knowledgePoint ? (
                        <span className="text-xs text-slate-400">{item.knowledgePoint.name}</span>
                      ) : null}
                    </div>
                    <QuestionContent
                      content={item.question}
                      className="mt-3 line-clamp-2 text-sm leading-7 text-slate-700"
                    />
                    <p className="mt-3 text-xs text-slate-400">
                      计划时间：{format(new Date(item.nextReviewDate), "MM-dd HH:mm")}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">暂时没有新的待安排任务。</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardPage>
  );
}
