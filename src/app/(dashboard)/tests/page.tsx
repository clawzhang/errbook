"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardHero, DashboardPage, SectionHeading } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Printer } from "lucide-react";
import { format } from "date-fns";

interface TestSessionItem {
  id: string;
  title: string | null;
  totalQuestions: number;
  correctCount: number;
  status: string;
  startedAt: string;
  completedAt: string | null;
}

export default function TestsPage() {
  const [sessions, setSessions] = useState<TestSessionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/dashboard");
        const data = await res.json();
        setSessions(data.recentTests || []);
      } catch {
        setSessions([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <DashboardPage>
      <DashboardHero
        eyebrow="考试记录"
        title="查看最近测试表现"
        description="这一页使用现有测试场次数据展示最近的考核记录、完成状态和答题正确率。"
        actions={
          <Link href="/test">
            <Button>生成新测试</Button>
          </Link>
        }
      />

      <Card>
        <CardContent className="p-5 md:p-6">
          <SectionHeading
            title="测试场次"
            description="这里展示最近创建的测试，后续可继续扩展为完整的考试记录中心。"
          />
          <div className="mt-6 space-y-4">
            {loading ? (
              <p className="text-sm text-muted-foreground">正在加载测试记录...</p>
            ) : sessions.length ? (
              sessions.map((item) => {
                const accuracy = item.totalQuestions
                  ? Math.round((item.correctCount / item.totalQuestions) * 100)
                  : 0;
                return (
                  <Link
                    key={item.id}
                    href={`/test/${item.id}`}
                    className="block rounded-[1.55rem] border border-white/80 bg-slate-50/72 px-5 py-5"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-bold text-slate-950">
                            {item.title || "错题测试"}
                          </h3>
                          <Badge variant={item.status === "COMPLETED" ? "secondary" : "outline"}>
                            {item.status === "COMPLETED" ? "已完成" : "进行中"}
                          </Badge>
                        </div>
                        <p className="mt-2 text-sm text-slate-500">
                          创建时间：{format(new Date(item.startedAt), "yyyy-MM-dd HH:mm")}
                          {item.completedAt
                            ? ` · 完成时间：${format(new Date(item.completedAt), "yyyy-MM-dd HH:mm")}`
                            : ""}
                        </p>
                        <div className="mt-3 flex gap-2">
                          <Link
                            href={`/test/${item.id}/print`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button variant="outline" size="sm">
                              <Printer className="mr-1 h-3.5 w-3.5" />
                              打印试卷
                            </Button>
                          </Link>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="rounded-[1.2rem] bg-white px-4 py-3 text-center shadow-[0_10px_24px_rgba(66,104,168,0.06)]">
                          <p className="text-xs text-slate-400">总题数</p>
                          <p className="mt-2 text-xl font-black text-slate-950">{item.totalQuestions}</p>
                        </div>
                        <div className="rounded-[1.2rem] bg-white px-4 py-3 text-center shadow-[0_10px_24px_rgba(66,104,168,0.06)]">
                          <p className="text-xs text-slate-400">答对</p>
                          <p className="mt-2 text-xl font-black text-slate-950">{item.correctCount}</p>
                        </div>
                        <div className="rounded-[1.2rem] bg-white px-4 py-3 text-center shadow-[0_10px_24px_rgba(66,104,168,0.06)]">
                          <p className="text-xs text-slate-400">正确率</p>
                          <p className="mt-2 text-xl font-black text-slate-950">{accuracy}%</p>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground">目前还没有测试记录。</p>
            )}
          </div>
        </CardContent>
      </Card>
    </DashboardPage>
  );
}
