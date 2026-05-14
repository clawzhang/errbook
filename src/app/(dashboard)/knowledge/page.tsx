"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BrainCircuit } from "lucide-react";
import { DashboardHero, DashboardPage, SectionHeading } from "@/components/layout/dashboard-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SUBJECTS } from "@/lib/constants";
import { KnowledgePointSelector } from "@/components/knowledge/knowledge-point-selector";
import { ErrorCard } from "@/components/errors/error-card";

interface ErrorItem {
  id: string;
  subject: string;
  question: string;
  masteryLevel: string;
  source: string;
  sourceDetail: string | null;
  nextReviewDate: string;
  createdAt: string;
  grade: number;
  semester: string;
  knowledgePoint?: { id: string; name: string } | null;
}

export default function KnowledgePage() {
  const [items, setItems] = useState<ErrorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [manageSubject, setManageSubject] = useState("MATH");
  const [selectedKnowledgePointId, setSelectedKnowledgePointId] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/errors?pageSize=300");
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

  const knowledgeMap = new Map<
    string,
    { id: string; name: string; subject: string; total: number; mastered: number }
  >();

  for (const item of items) {
    if (!item.knowledgePoint) continue;
    const record = knowledgeMap.get(item.knowledgePoint.id) || {
      id: item.knowledgePoint.id,
      name: item.knowledgePoint.name,
      subject: item.subject,
      total: 0,
      mastered: 0,
    };
    record.total += 1;
    if (item.masteryLevel === "MASTERED") record.mastered += 1;
    knowledgeMap.set(item.knowledgePoint.id, record);
  }

  const list = Array.from(knowledgeMap.values())
    .map((item) => ({
      ...item,
      percent: item.total ? Math.round((item.mastered / item.total) * 100) : 0,
    }))
    .sort((a, b) => a.percent - b.percent || b.total - a.total);
  const selectedKnowledgePoint = list.find(
    (item) => item.id === selectedKnowledgePointId
  );
  const selectedErrors = selectedKnowledgePointId
    ? items.filter((item) => item.knowledgePoint?.id === selectedKnowledgePointId)
    : [];

  return (
    <DashboardPage>
      <DashboardHero
        eyebrow="知识点"
        title="按知识点查看掌握进度"
        description="把错题聚合到知识点维度，快速定位薄弱知识块，并回到错题本查看具体题目。"
      />

      <Card>
        <CardContent className="p-5 md:p-6">
          <SectionHeading
            title="维护知识点"
            description="按学科新增或编辑知识点，录入错题时也可以直接维护。"
          />
          <div className="mt-5 grid gap-4 md:grid-cols-[220px_1fr] md:items-end">
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">学科</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(SUBJECTS).map(([key, config]) => (
                  <Button
                    key={key}
                    type="button"
                    variant={manageSubject === key ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setManageSubject(key);
                      setSelectedKnowledgePointId("");
                    }}
                  >
                    {config.label}
                  </Button>
                ))}
              </div>
            </div>
            <KnowledgePointSelector
              subject={manageSubject}
              value={selectedKnowledgePointId}
              onChange={setSelectedKnowledgePointId}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 md:p-6">
          <SectionHeading
            title="知识点掌握矩阵"
            description="优先从掌握度低、关联错题多的知识点开始复习。"
          />
          <div className="mt-6 grid gap-4 xl:grid-cols-2">
            {loading ? (
              <p className="text-sm text-muted-foreground">正在加载知识点数据...</p>
            ) : list.length ? (
              list.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-[1.35rem] border px-5 py-5 transition ${
                    selectedKnowledgePointId === item.id
                      ? "border-primary/40 bg-blue-50/70 shadow-[0_14px_32px_rgba(59,101,176,0.12)]"
                      : "border-white/80 bg-slate-50/72"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left"
                      onClick={() => setSelectedKnowledgePointId(item.id)}
                    >
                      <div className="flex items-center gap-2">
                        <BrainCircuit className="size-4 text-primary" />
                        <h3 className="font-bold text-slate-950">{item.name}</h3>
                      </div>
                      <p className="mt-2 text-sm text-slate-500">
                        关联错题 {item.total} 题 · 科目 {SUBJECTS[item.subject as keyof typeof SUBJECTS]?.label || item.subject}
                      </p>
                    </button>
                    <Link href={`/errors?knowledgePointId=${item.id}`}>
                      <Button variant="ghost" size="sm">
                        查看题目
                        <ArrowRight className="ml-1 size-4" />
                      </Button>
                    </Link>
                  </div>
                  <div className="mt-5">
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-slate-500">掌握度</span>
                      <Badge variant="outline">{item.percent}%</Badge>
                    </div>
                    <div className="h-2.5 rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-linear-to-r from-blue-400 via-sky-400 to-emerald-400"
                        style={{ width: `${Math.max(item.percent, 6)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">当前还没有绑定知识点的错题。</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 md:p-6">
          <SectionHeading
            title={
              selectedKnowledgePoint
                ? `${selectedKnowledgePoint.name} 的错题`
                : "知识点错题内容"
            }
            description="点击上方知识点后，在这里直接查看该知识点关联的错题内容。"
            action={
              selectedKnowledgePoint ? (
                <Link href={`/errors?knowledgePointId=${selectedKnowledgePoint.id}`}>
                  <Button variant="outline" size="sm">打开筛选列表</Button>
                </Link>
              ) : null
            }
          />
          <div className="mt-5">
            {!selectedKnowledgePointId ? (
              <p className="text-sm text-muted-foreground">请选择一个知识点查看关联错题。</p>
            ) : selectedErrors.length ? (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {selectedErrors.map((error) => (
                  <ErrorCard
                    key={error.id}
                    error={error}
                    detailHref={`/errors/${error.id}?knowledgePointId=${selectedKnowledgePointId}&sort=createdAt&order=desc`}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">当前知识点还没有关联错题。</p>
            )}
          </div>
        </CardContent>
      </Card>
    </DashboardPage>
  );
}
