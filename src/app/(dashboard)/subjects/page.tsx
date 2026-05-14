"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpenText, CheckCircle2, Clock3, Languages, PenTool, Sigma } from "lucide-react";
import { DashboardHero, DashboardPage, SectionHeading } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SubjectTag } from "@/components/common/subject-tag";
import { QuestionContent } from "@/components/common/question-content";
import { SUBJECTS } from "@/lib/constants";

interface ErrorItem {
  id: string;
  subject: string;
  question: string;
  masteryLevel: string;
  nextReviewDate: string;
  createdAt: string;
  knowledgePoint?: { id: string; name: string } | null;
}

export default function SubjectsPage() {
  const [items, setItems] = useState<ErrorItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/errors?pageSize=200");
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

  const grouped = ["CHINESE", "MATH", "ENGLISH"].map((subject) => {
    const subjectItems = items.filter((item) => item.subject === subject);
    const mastered = subjectItems.filter((item) => item.masteryLevel === "MASTERED").length;
    const due = subjectItems.filter((item) => new Date(item.nextReviewDate) <= new Date()).length;
    return {
      subject,
      total: subjectItems.length,
      mastered,
      due,
      recent: subjectItems.slice(0, 2),
      accuracy: subjectItems.length ? Math.round((mastered / subjectItems.length) * 100) : 0,
    };
  });

  const subjectMeta = {
    CHINESE: {
      icon: PenTool,
      mark: "文",
      tone: "bg-rose-50 text-rose-700 border-rose-100",
      bar: "bg-rose-500",
      panel: "border-rose-200/80 bg-rose-50/55 shadow-[inset_5px_0_0_rgba(244,63,94,0.65),0_12px_30px_rgba(148,90,105,0.08)]",
    },
    MATH: {
      icon: Sigma,
      mark: "数",
      tone: "bg-indigo-50 text-indigo-700 border-indigo-100",
      bar: "bg-indigo-500",
      panel: "border-indigo-200/80 bg-indigo-50/55 shadow-[inset_5px_0_0_rgba(99,102,241,0.65),0_12px_30px_rgba(90,95,148,0.08)]",
    },
    ENGLISH: {
      icon: Languages,
      mark: "英",
      tone: "bg-emerald-50 text-emerald-700 border-emerald-100",
      bar: "bg-emerald-500",
      panel: "border-emerald-200/80 bg-emerald-50/55 shadow-[inset_5px_0_0_rgba(16,185,129,0.65),0_12px_30px_rgba(72,132,109,0.08)]",
    },
  } as const;

  return (
    <DashboardPage>
      <DashboardHero
        eyebrow="分类浏览"
        title="按学科查看错题"
        description="从语文、数学、英语三个维度快速查看错题数量、掌握进度和待复习任务，直接跳转到对应筛选结果。"
        actions={
          <Link href="/errors">
            <Button>前往错题本</Button>
          </Link>
        }
      />

      <Card>
        <CardContent className="p-5 md:p-6">
          <SectionHeading
            title="学科总览"
            description="用同一套学习视角查看不同学科的错题积累与消化进度。"
          />
          <div className="mt-5 grid gap-3">
            {grouped.map((group) => (
              <div
                key={group.subject}
                className={`rounded-[1.35rem] border px-4 py-4 ${subjectMeta[group.subject as keyof typeof subjectMeta].panel}`}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                  <div className="flex min-w-48 items-center gap-3">
                    <div
                      className={`flex size-12 shrink-0 items-center justify-center rounded-[1rem] border text-lg font-black ${subjectMeta[group.subject as keyof typeof subjectMeta].tone}`}
                    >
                      {group.total > 0 ? (
                        (() => {
                          const Icon = subjectMeta[group.subject as keyof typeof subjectMeta].icon;
                          return <Icon className="size-5" />;
                        })()
                      ) : (
                        subjectMeta[group.subject as keyof typeof subjectMeta].mark
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-black tracking-[-0.03em] text-slate-950">
                          {SUBJECTS[group.subject as keyof typeof SUBJECTS].label}
                        </h3>
                        <SubjectTag subject={group.subject} />
                      </div>
                      <div className="mt-2 h-1.5 w-28 rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full ${subjectMeta[group.subject as keyof typeof subjectMeta].bar}`}
                          style={{ width: `${Math.max(group.accuracy, group.total ? 8 : 0)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-4">
                    {[
                      { label: "总错题", value: group.total, icon: BookOpenText },
                      { label: "已掌握", value: group.mastered, icon: CheckCircle2 },
                      { label: "待复习", value: group.due, icon: Clock3 },
                      { label: "掌握率", value: `${group.accuracy}%`, icon: CheckCircle2 },
                    ].map((metric) => (
                      <div key={metric.label} className="rounded-[1rem] bg-white/82 px-3 py-2.5">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                          <metric.icon className="size-3.5" />
                          {metric.label}
                        </div>
                        <p className="mt-1 text-xl font-black tracking-[-0.03em] text-slate-950">
                          {metric.value}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="min-w-0 lg:w-[320px]">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-900">最近错题</p>
                      <Link href={`/errors?subject=${group.subject}`}>
                        <Button variant="ghost" size="sm">
                          查看
                          <ArrowRight className="ml-1 size-4" />
                        </Button>
                      </Link>
                    </div>
                    {loading ? (
                      <p className="text-sm text-muted-foreground">正在加载...</p>
                    ) : group.recent.length ? (
                      <div className="space-y-2">
                        {group.recent.map((item) => (
                          <Link
                            key={item.id}
                            href={`/errors/${item.id}?subject=${group.subject}`}
                            className="block rounded-[0.95rem] border border-slate-100 bg-white/86 px-3 py-2"
                          >
                            <QuestionContent
                              content={item.question}
                              className="line-clamp-1 text-sm leading-6 text-slate-700"
                            />
                            {item.knowledgePoint ? (
                              <Badge variant="outline" className="mt-1.5">
                                {item.knowledgePoint.name}
                              </Badge>
                            ) : null}
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">暂时还没有该学科的错题。</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </DashboardPage>
  );
}
