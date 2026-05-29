"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ErrorCard } from "@/components/errors/error-card";
import { ErrorFilters } from "@/components/errors/error-filters";
import { Plus } from "lucide-react";
import { DashboardPage, EmptyStateCard } from "@/components/layout/dashboard-shell";

interface ErrorItem {
  id: string;
  subject: string;
  questionType: string | null;
  question: string;
  masteryLevel: string;
  source: string;
  sourceDetail: string | null;
  nextReviewDate: string;
  createdAt: string;
  grade: number;
  semester: string;
  knowledgePoint: { id: string; name: string } | null;
}

export default function ErrorsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const knowledgePointId = searchParams.get("knowledgePointId") || "";
  const [errors, setErrors] = useState<ErrorItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [subject, setSubject] = useState("");
  const [masteryLevel, setMasteryLevel] = useState("");
  const [source, setSource] = useState("");
  const [needReview, setNeedReview] = useState(false);
  const [currentGradeLabel, setCurrentGradeLabel] = useState("");
  const [gradeFilter, setGradeFilter] = useState("current");
  const [activeGradeParams, setActiveGradeParams] = useState<{
    grade: string;
    semester?: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/grade")
      .then((r) => r.json())
      .then((d) => {
        if (d.currentLabel) setCurrentGradeLabel(d.currentLabel);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    async function loadErrors() {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          pageSize: "20",
        });
        if (subject) params.set("subject", subject);
        if (masteryLevel) params.set("masteryLevel", masteryLevel);
        if (source) params.set("source", source);
        if (knowledgePointId) params.set("knowledgePointId", knowledgePointId);
        if (needReview) params.set("needReview", "true");
        if (gradeFilter) {
          if (gradeFilter === "current" && currentGradeLabel) {
            const gradeRes = await fetch("/api/grade");
            const gradeData = await gradeRes.json();
            if (gradeData.currentGrade) {
              params.set("grade", gradeData.currentGrade.toString());
              params.set("semester", gradeData.currentSemester);
              setActiveGradeParams({
                grade: gradeData.currentGrade.toString(),
                semester: gradeData.currentSemester,
              });
            }
          } else if (gradeFilter.includes("-")) {
            const [g, s] = gradeFilter.split("-");
            params.set("grade", g);
            if (s) params.set("semester", s);
            setActiveGradeParams({ grade: g, semester: s });
          }
        } else {
          setActiveGradeParams(null);
        }

        const res = await fetch(`/api/errors?${params}`);
        const data = await res.json();
        setErrors(data.items || []);
        setTotal(data.total || 0);
      } catch {
        setErrors([]);
      } finally {
        setLoading(false);
      }
    }

    void loadErrors();
  }, [page, subject, masteryLevel, source, knowledgePointId, needReview, gradeFilter, currentGradeLabel]);

  function handleFilterChange(setter: (v: string) => void) {
    return (value: string | null) => {
      setter(value || "");
      setPage(1);
    };
  }

  function clearFilters() {
    setSubject("");
    setMasteryLevel("");
    setSource("");
    setNeedReview(false);
    setGradeFilter("");
    setPage(1);
    if (knowledgePointId) router.replace("/errors");
  }

  const totalPages = Math.ceil(total / 20);
  const detailParams = new URLSearchParams();
  if (subject) detailParams.set("subject", subject);
  if (masteryLevel) detailParams.set("masteryLevel", masteryLevel);
  if (source) detailParams.set("source", source);
  if (knowledgePointId) detailParams.set("knowledgePointId", knowledgePointId);
  if (needReview) detailParams.set("needReview", "true");
  if (activeGradeParams) {
    detailParams.set("grade", activeGradeParams.grade);
    if (activeGradeParams.semester) detailParams.set("semester", activeGradeParams.semester);
  }
  detailParams.set("sort", "createdAt");
  detailParams.set("order", "desc");

  return (
    <DashboardPage className="gap-3">
      <section className="dashboard-panel px-4 py-3 md:px-5">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {currentGradeLabel ? (
              <span className="rounded-full border border-white/80 bg-white/72 px-3 py-1 text-xs font-semibold text-slate-500">
                {currentGradeLabel}
              </span>
            ) : (
              <span />
            )}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant={gradeFilter ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setGradeFilter((prev) => (prev ? "" : "current"));
                  setPage(1);
                }}
              >
                {gradeFilter ? "当前年级" : "全部年级"}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setGradeFilter("")}>
                查看全部
              </Button>
              <Link href="/errors/new">
                <Button size="sm">
                  <Plus className="mr-1 h-4 w-4" />
                  添加错题
                </Button>
              </Link>
            </div>
          </div>

          <div className="rounded-[1.35rem] border border-white/80 bg-white/80 p-3 shadow-[0_10px_24px_rgba(59,101,176,0.06)]">
            <ErrorFilters
              subject={subject}
              masteryLevel={masteryLevel}
              source={source}
              needReview={needReview}
              onSubjectChange={handleFilterChange(setSubject)}
              onMasteryLevelChange={handleFilterChange(setMasteryLevel)}
              onSourceChange={handleFilterChange(setSource)}
              onNeedReviewChange={(v) => {
                setNeedReview(v);
                setPage(1);
              }}
              onClear={clearFilters}
            />
          </div>
        </div>
      </section>

      {loading ? (
        <EmptyStateCard
          title="错题列表加载中"
          description="正在整理当前筛选条件下的错题列表，请稍候。"
        />
      ) : errors.length === 0 ? (
        <EmptyStateCard
          title="还没有符合条件的错题"
          description="你可以先添加一条新的错题，或者清空筛选条件，查看已有的其他错题。"
          action={
            <Link href="/errors/new">
              <Button size="sm">添加第一道错题</Button>
            </Link>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {errors.map((error) => (
              <ErrorCard
                key={error.id}
                error={error}
                detailHref={`/errors/${error.id}?${detailParams.toString()}`}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-1">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                上一页
              </Button>
              <span className="text-sm text-muted-foreground">
                {page} / {totalPages}（共 {total} 题）
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                下一页
              </Button>
            </div>
          )}
        </>
      )}
    </DashboardPage>
  );
}
