"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Clock,
  Bot,
  Loader2,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import { toast } from "sonner";
import { MarkdownContent } from "@/components/common/markdown-content";
import { DashboardHero, DashboardPage, EmptyStateCard, SectionHeading } from "@/components/layout/dashboard-shell";

interface StatsData {
  summary: {
    totalErrors: number;
    masteredCount: number;
    partiallyMasteredCount: number;
    notMasteredCount: number;
    todayReviewCount: number;
    todayCompletedCount: number;
  };
  subjectDistribution: { subject: string; count: number }[];
  masteryDistribution: { subject: string; masteryLevel: string; count: number }[];
  accuracyTrend: { date: string; rate: number }[];
  errorGrowthTrend: { date: string; count: number }[];
  weakKnowledgePoints: {
    id: string;
    name: string;
    subject: string;
    avgMastery: number;
    errorCount: number;
  }[];
}

const COLORS = ["#ef4444", "#3b82f6", "#22c55e"];
const masteryLevels = ["未掌握", "部分掌握", "已掌握"] as const;

export default function StatsPage() {
  const [data, setData] = useState<StatsData | null>(null);
  const [period, setPeriod] = useState("month");
  const [loading, setLoading] = useState(true);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [summarizing, setSummarizing] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/stats?period=${period}`);
        const d = await res.json();
        setData(d);
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [period]);

  if (loading) {
    return (
      <DashboardPage>
        <EmptyStateCard
          title="统计看板加载中"
          description="正在整理你的错题概览、正确率趋势和薄弱知识点，请稍候。"
        />
      </DashboardPage>
    );
  }

  if (!data) {
    return (
      <DashboardPage>
        <EmptyStateCard
          title="统计数据暂时不可用"
          description="本次没有成功拿到统计数据，你可以稍后重试，或者先继续录入和复习错题。"
        />
      </DashboardPage>
    );
  }

  const { summary } = data;

  return (
    <DashboardPage className="gap-4">
      <DashboardHero
        eyebrow="统计分析"
        title="用数据追踪学习节奏"
        description="从错题数量、复习正确率、知识点薄弱程度和学科分布几个角度，持续观察你的学习状态。"
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                setSummarizing(true);
                try {
                  const res = await fetch("/api/ai/summarize", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ limit: 20 }),
                  });
                  const d = await res.json();
                  if (res.ok) setAiSummary(d.summary);
                  else toast.error(d.error || "AI 总结失败");
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "AI 总结失败");
                } finally {
                  setSummarizing(false);
                }
              }}
              disabled={summarizing}
            >
              {summarizing ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <Bot className="mr-1 h-4 w-4" />
              )}
              {summarizing ? "总结中..." : "AI 总结"}
            </Button>
            <Select value={period} onValueChange={(v) => v && setPeriod(v)}>
              <SelectTrigger className="w-[128px]">
                <SelectValue placeholder="时间范围">
                  {{ week: "本周", month: "本月", semester: "本学期", all: "全部" }[period] || null}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">本周</SelectItem>
                <SelectItem value="month">本月</SelectItem>
                <SelectItem value="semester">本学期</SelectItem>
                <SelectItem value="all">全部</SelectItem>
              </SelectContent>
            </Select>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="mb-1 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-blue-500" />
              <span className="text-xs text-muted-foreground">总错题</span>
            </div>
            <p className="text-2xl font-bold">{summary.totalErrors}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="mb-1 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-xs text-muted-foreground">已掌握</span>
            </div>
            <p className="text-2xl font-bold">{summary.masteredCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="mb-1 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="text-xs text-muted-foreground">未掌握</span>
            </div>
            <p className="text-2xl font-bold">{summary.notMasteredCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="mb-1 flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-500" />
              <span className="text-xs text-muted-foreground">今日待复习</span>
            </div>
            <p className="text-2xl font-bold">{summary.todayReviewCount}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardContent className="p-4 md:p-5">
            <SectionHeading title="科目分布" description="查看错题主要集中在哪些学科。" />
            <div className="mt-4">
              {data.subjectDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={data.subjectDistribution}
                      dataKey="count"
                      nameKey="subject"
                      cx="50%"
                      cy="50%"
                      outerRadius={66}
                      label
                    >
                      {data.subjectDistribution.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="py-6 text-center text-muted-foreground">暂无数据</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 md:p-5">
            <SectionHeading title="复习正确率趋势" description="观察一段时间内的复习质量是否稳定。" />
            <div className="mt-4">
              {data.accuracyTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={data.accuracyTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                    <Tooltip formatter={(v) => `${v}%`} />
                    <Line
                      type="monotone"
                      dataKey="rate"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="py-6 text-center text-muted-foreground">暂无数据</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {data.weakKnowledgePoints.length > 0 && (
        <Card>
          <CardContent className="p-4 md:p-5">
            <SectionHeading title="薄弱知识点" description="优先处理掌握度低、错题更集中的知识块。" />
            <div className="mt-4">
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={data.weakKnowledgePoints} layout="vertical" margin={{ left: 70 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    domain={[0, 2]}
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => ["未掌握", "部分掌握", "已掌握"][v] || ""}
                  />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={72} />
                  <Tooltip
                    formatter={(v) => ["未掌握", "部分掌握", "已掌握"][Math.round(Number(v))] || v}
                  />
                  <Bar dataKey="avgMastery" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-4 md:p-5">
          <SectionHeading title="掌握度分布" description="从学科维度查看当前掌握状态结构。" />
          <div className="mt-4">
            {data.masteryDistribution.length > 0 ? (
              <div className="grid gap-3 xl:grid-cols-3">
                {["语文", "数学", "英语"].map((subject) => {
                  const items = data.masteryDistribution.filter((m) => m.subject === subject);
                  const countByLevel = Object.fromEntries(
                    items.map((item) => [item.masteryLevel, item.count])
                  ) as Record<string, number | undefined>;
                  const total = masteryLevels.reduce(
                    (sum, level) => sum + (countByLevel[level] || 0),
                    0
                  );

                  return (
                    <div
                      key={subject}
                      className="rounded-[1.2rem] border border-slate-200/80 bg-slate-50/70 p-3"
                    >
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <h4 className="text-sm font-bold text-slate-900">{subject}</h4>
                        <span className="text-xs text-muted-foreground">共 {total} 题</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {masteryLevels.map((level) => (
                          <Badge
                            key={level}
                            variant="secondary"
                            className={
                              level === "未掌握"
                                ? "bg-red-100 text-red-700"
                                : level === "部分掌握"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-green-100 text-green-700"
                            }
                          >
                            {level} {countByLevel[level] || 0}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="py-4 text-center text-muted-foreground">暂无数据</p>
            )}
          </div>
        </CardContent>
      </Card>

      {aiSummary && (
        <Card>
          <CardContent className="p-4 md:p-5">
            <SectionHeading
              title="AI 错题总结"
              description="使用 AI 总结近期错题特点与改进方向。"
            />
            <div className="mt-4 rounded-lg bg-muted/50 p-4">
              <MarkdownContent content={aiSummary} />
            </div>
          </CardContent>
        </Card>
      )}
    </DashboardPage>
  );
}
