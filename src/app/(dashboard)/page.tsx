"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpenText,
  CheckCircle2,
  Clock3,
  Target,
} from "lucide-react";
import {
  DashboardHero,
  DashboardPage,
  EmptyStateCard,
  GlassMiniCard,
  MetricCard,
  SectionHeading,
} from "@/components/layout/dashboard-shell";
import { SubjectTag } from "@/components/common/subject-tag";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QuestionContent } from "@/components/common/question-content";
import { format } from "date-fns";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface DashboardData {
  greeting: {
    name: string;
    currentDateLabel: string;
    weekdayLabel: string;
    currentStage: string;
  };
  summary: {
    totalErrors: number;
    masteredCount: number;
    dueCount: number;
    reviewAccuracy: number;
    todayReviewCount: number;
    completedTodayCount: number;
    totalTests: number;
  };
  trend: { label: string; count: number }[];
  knowledgeProgress: {
    id: string;
    label: string;
    subject: string;
    percent: number;
    total: number;
  }[];
  subjectDistribution: {
    key: string;
    label: string;
    count: number;
    percent: number;
  }[];
  recentErrors: {
    id: string;
    subject: string;
    question: string;
    source: string;
    sourceLabel: string;
    sourceDetail?: string | null;
    createdAt: string;
    knowledgePoint?: { id: string; name: string } | null;
  }[];
  recentReview: {
    id: string;
    subject: string;
    question: string;
    nextReviewDate: string;
    masteryLevel: string;
    knowledgePoint?: { id: string; name: string } | null;
  }[];
  completedReview: {
    id: string;
    createdAt: string;
    quality: string;
    error: {
      id: string;
      subject: string;
      question: string;
      knowledgePoint?: { id: string; name: string } | null;
    };
  }[];
  recentTests: {
    id: string;
    title: string | null;
    totalQuestions: number;
    correctCount: number;
    status: string;
    startedAt: string;
    completedAt: string | null;
  }[];
}

const SUBJECT_COLORS = ["#3b82f6", "#6aa7ff", "#ffc75f", "#ff927e", "#b8a1ff"];

export default function DashboardHomePage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/dashboard");
        const json = await res.json();
        if (res.ok) {
          setData(json);
        } else {
          setData(null);
        }
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const trendMax = useMemo(() => {
    if (!data?.trend.length) return 10;
    return Math.max(...data.trend.map((item) => item.count), 10);
  }, [data]);

  if (loading) {
    return (
      <DashboardPage>
        <EmptyStateCard
          title="首页加载中"
          description="正在整理你的错题趋势、待复习任务和学习概览，请稍候。"
        />
      </DashboardPage>
    );
  }

  if (!data) {
    return (
      <DashboardPage>
        <EmptyStateCard
          title="首页暂时无法加载"
          description="本次没有成功拿到首页数据，你可以先进入错题本继续学习，稍后再回来查看全局概览。"
          action={
            <Link href="/errors">
              <Button size="sm">前往错题本</Button>
            </Link>
          }
        />
      </DashboardPage>
    );
  }

  return (
    <DashboardPage className="gap-4">
      <DashboardHero
        showIntro
        eyebrow="学习总览"
        title={`你好，${data.greeting.name}`}
        description={`今天是 ${data.greeting.currentDateLabel}，${data.greeting.weekdayLabel}。当前学习阶段：${data.greeting.currentStage}。先看今天的复习任务，再处理最近新增的错题。`}
        actions={
          <>
            <Link href="/review">
              <Button size="sm">开始今日复习</Button>
            </Link>
            <Link href="/errors/new">
              <Button size="sm" variant="outline">添加新错题</Button>
            </Link>
          </>
        }
        aside={
          <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
            <GlassMiniCard
              title="今日待复习"
              value={`${data.summary.todayReviewCount} 题`}
              description="按 SM-2 节奏自动生成"
            />
            <GlassMiniCard
              title="已完成复习"
              value={`${data.summary.completedTodayCount} 次`}
              description="今天已经复盘的题目"
            />
            <GlassMiniCard
              title="最近测试"
              value={`${data.summary.totalTests} 场`}
              description="继续追踪你的练习表现"
            />
          </div>
        }
      />

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="错题总数"
          value={data.summary.totalErrors}
          hint="累计录入的错题数量"
          trend="持续积累"
          icon={BookOpenText}
        />
        <MetricCard
          title="已掌握"
          value={data.summary.masteredCount}
          hint="已经稳定掌握的题目"
          trend="状态提升"
          icon={CheckCircle2}
          iconTint="bg-emerald-50 text-emerald-600"
        />
        <MetricCard
          title="待复习"
          value={data.summary.dueCount}
          hint="包含今天和已逾期任务"
          trend="及时处理"
          icon={Clock3}
          iconTint="bg-amber-50 text-amber-600"
        />
        <MetricCard
          title="复习正确率"
          value={`${data.summary.reviewAccuracy}%`}
          hint="基于历史复习记录计算"
          trend="节奏稳定"
          icon={Target}
          iconTint="bg-violet-50 text-violet-600"
        />
      </section>

      <section className="grid gap-3 xl:grid-cols-[minmax(0,1.7fr)_minmax(300px,0.92fr)]">
        <Card className="overflow-hidden">
          <CardContent className="p-3.5 md:p-4">
            <SectionHeading
              title="错题趋势"
              description="观察最近 7 天新增错题数量，判断练习强度和错题输入节奏。"
              action={<Badge variant="outline">近 7 天</Badge>}
            />
            <div className="mt-3 h-[232px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.trend}>
                  <defs>
                    <linearGradient id="trendGradient" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.34} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 8" vertical={false} stroke="#dce8fb" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#7c8da6", fontSize: 12 }} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#7c8da6", fontSize: 12 }}
                    allowDecimals={false}
                    domain={[0, trendMax]}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 18,
                      border: "1px solid rgba(255,255,255,0.86)",
                      boxShadow: "0 16px 40px rgba(58,92,160,0.14)",
                      background: "rgba(255,255,255,0.95)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    fill="url(#trendGradient)"
                    dot={{ r: 4, strokeWidth: 0, fill: "#3b82f6" }}
                    activeDot={{ r: 6, strokeWidth: 0, fill: "#2563eb" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-3">
          <Card>
            <CardContent className="p-3.5 md:p-4">
              <SectionHeading
                title="知识点掌握情况"
                description="按掌握度和错题集中度排序的薄弱知识点。"
              />
              <div className="mt-3 space-y-3">
                {data.knowledgeProgress.length ? (
                  data.knowledgeProgress.map((item) => (
                    <div key={item.id}>
                      <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                        <div>
                          <p className="font-semibold text-slate-900">{item.label}</p>
                          <p className="text-xs text-slate-400">
                            {item.subject} · {item.total} 题
                          </p>
                        </div>
                        <span className="font-semibold text-slate-500">{item.percent}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-linear-to-r from-emerald-400 via-blue-400 to-indigo-500"
                          style={{ width: `${Math.max(item.percent, 6)}%` }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">暂时还没有关联知识点的数据。</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3.5 md:p-4">
              <SectionHeading
                title="错题分布"
                description="按学科观察当前错题结构。"
              />
              <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="h-[150px] flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.subjectDistribution}
                        dataKey="count"
                        nameKey="label"
                        innerRadius={44}
                        outerRadius={68}
                        paddingAngle={2}
                      >
                        {data.subjectDistribution.map((entry, index) => (
                          <Cell
                            key={entry.key}
                            fill={SUBJECT_COLORS[index % SUBJECT_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          borderRadius: 18,
                          border: "1px solid rgba(255,255,255,0.86)",
                          boxShadow: "0 16px 40px rgba(58,92,160,0.14)",
                          background: "rgba(255,255,255,0.95)",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                  {data.subjectDistribution.map((item, index) => (
                    <div key={item.key} className="flex items-center gap-2.5 text-sm">
                      <span
                        className="inline-block size-2.5 rounded-full"
                        style={{ backgroundColor: SUBJECT_COLORS[index % SUBJECT_COLORS.length] }}
                      />
                      <span className="min-w-12 text-slate-500">{item.label}</span>
                      <span className="font-semibold text-slate-900">{item.count} 题</span>
                      <span className="text-slate-400">{item.percent}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-3 xl:grid-cols-[minmax(0,1.7fr)_minmax(300px,0.92fr)]">
        <Card>
          <CardContent className="p-3.5 md:p-4">
            <SectionHeading
              title="最近错题"
              description="优先处理最近录入的题目，保持记录和复盘的连续性。"
              action={
                <Link href="/errors">
                  <Button variant="ghost" size="sm">
                    查看全部
                    <ArrowRight className="ml-1 size-4" />
                  </Button>
                </Link>
              }
            />
            <div className="mt-3 space-y-3">
              {data.recentErrors.length ? (
                data.recentErrors.map((item) => (
                  <Link
                    key={item.id}
                    href={`/errors/${item.id}`}
                    className="block rounded-[1.2rem] border border-slate-100 bg-slate-50/72 px-3.5 py-3 transition-colors hover:bg-white"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <SubjectTag subject={item.subject} />
                      {item.knowledgePoint ? (
                        <Badge variant="outline">{item.knowledgePoint.name}</Badge>
                      ) : null}
                      <Badge variant="secondary">{item.sourceLabel}</Badge>
                    </div>
                    <QuestionContent
                      content={item.question}
                      className="mt-2 line-clamp-2 text-sm leading-6 text-slate-700"
                    />
                    <p className="mt-2 text-xs text-slate-400">
                      录入时间：{format(new Date(item.createdAt), "MM-dd HH:mm")}
                      {item.sourceDetail ? ` · ${item.sourceDetail}` : ""}
                    </p>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">还没有新的错题记录。</p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-3">
          <Card>
            <CardContent className="p-3.5 md:p-4">
              <SectionHeading
                title="最近复习"
                description="今天优先完成到期任务。"
              />
              <div className="mt-3 space-y-3">
                {data.recentReview.length ? (
                  data.recentReview.map((item) => (
                    <Link
                      key={item.id}
                      href="/review"
                      className="block rounded-[1.15rem] border border-slate-100 bg-slate-50/72 px-3.5 py-3 transition-colors hover:bg-white"
                    >
                      <div className="flex items-center gap-2">
                        <SubjectTag subject={item.subject} />
                        {item.knowledgePoint ? (
                          <Badge variant="outline">{item.knowledgePoint.name}</Badge>
                        ) : null}
                      </div>
                      <QuestionContent
                        content={item.question}
                        className="mt-2 line-clamp-2 text-sm leading-6 text-slate-700"
                      />
                      <p className="mt-2 text-xs text-slate-400">
                        复习时间：{format(new Date(item.nextReviewDate), "MM-dd HH:mm")}
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
            <CardContent className="p-3.5 md:p-4">
              <SectionHeading
                title="最近测试"
                description="跟踪最近几次考核测试的完成情况。"
              />
              <div className="mt-3 space-y-2.5">
                {data.recentTests.length ? (
                  data.recentTests.map((item) => {
                    const accuracy = item.totalQuestions
                      ? Math.round((item.correctCount / item.totalQuestions) * 100)
                      : 0;
                    return (
                      <Link
                        key={item.id}
                        href={`/test/${item.id}`}
                        className="block rounded-[1.1rem] border border-slate-100 bg-slate-50/72 px-3.5 py-3 transition-colors hover:bg-white"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="font-semibold text-slate-900">{item.title || "错题测试"}</p>
                            <p className="mt-1 text-xs text-slate-400">
                              开始于 {format(new Date(item.startedAt), "MM-dd HH:mm")}
                            </p>
                          </div>
                          <Badge variant={item.status === "COMPLETED" ? "secondary" : "outline"}>
                            {item.status === "COMPLETED" ? "已完成" : "进行中"}
                          </Badge>
                        </div>
                        <p className="mt-2 text-sm text-slate-500">
                          共 {item.totalQuestions} 题，答对 {item.correctCount} 题，正确率 {accuracy}%
                        </p>
                      </Link>
                    );
                  })
                ) : (
                  <p className="text-sm text-muted-foreground">还没有测试记录，先去生成一场测试吧。</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </DashboardPage>
  );
}
