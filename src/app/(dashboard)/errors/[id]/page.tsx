"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SubjectTag } from "@/components/common/subject-tag";
import { MasteryBadge } from "@/components/common/mastery-badge";
import { MarkdownContent } from "@/components/common/markdown-content";
import { QuestionContent } from "@/components/common/question-content";
import { ImageLightboxGallery } from "@/components/common/image-lightbox-gallery";
import { ERROR_SOURCES } from "@/lib/constants";
import { use } from "react";
import { format } from "date-fns";
import { ArrowLeft, ArrowRight, Edit, Trash2, Bot, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { DashboardHero, DashboardPage, EmptyStateCard, SectionHeading } from "@/components/layout/dashboard-shell";

interface ErrorDetail {
  id: string;
  subject: string;
  question: string;
  questionImages: string;
  wrongAnswer: string;
  correctAnswer: string;
  analysis: string | null;
  errorReason: string | null;
  source: string;
  sourceDetail: string | null;
  masteryLevel: string;
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReviewDate: string;
  lastReviewDate: string | null;
  createdAt: string;
  knowledgePoint: { id: string; name: string } | null;
  reviews: { id: string; quality: string; createdAt: string }[];
}

export default function ErrorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<ErrorDetail | null>(null);
  const [neighbors, setNeighbors] = useState<{
    prev: { id: string } | null;
    next: { id: string } | null;
  }>({ prev: null, next: null });
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisDraft, setAnalysisDraft] = useState("");
  const [savingAnalysis, setSavingAnalysis] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/errors/${id}`);
        const data = await res.json();
        if (res.ok) {
          setError(data.error);
        } else {
          toast.error("未找到该错题");
          router.push("/errors");
        }
      } catch {
        toast.error("加载失败");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, router]);

  useEffect(() => {
    async function loadNeighbors() {
      try {
        const query = searchParams.toString();
        const res = await fetch(
          `/api/errors/${id}/neighbors${query ? `?${query}` : ""}`
        );
        const data = await res.json();
        if (res.ok) {
          setNeighbors({ prev: data.prev, next: data.next });
        }
      } catch {
        setNeighbors({ prev: null, next: null });
      }
    }

    loadNeighbors();
  }, [id, searchParams]);

  async function handleDelete() {
    try {
      const res = await fetch(`/api/errors/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("已删除");
        router.push("/errors");
        router.refresh();
      }
    } catch {
      toast.error("删除失败");
    }
  }

  async function handleAIAnalysis() {
    setAnalyzing(true);
    try {
      const res = await fetch(`/api/ai/analyze/${id}`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setError((current) =>
          current
            ? {
                ...current,
                analysis: data.analysis,
              }
            : current
        );
        setAnalysisDraft(data.analysis);
        setAnalysisOpen(false);
        toast.success("AI 分析已生成，请审核内容后保存提交");
      } else {
        toast.error(data.error || "AI 分析失败");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "AI 分析失败");
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleSaveAnalysis() {
    if (!analysisDraft) return;

    setSavingAnalysis(true);
    try {
      const res = await fetch(`/api/errors/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysis: analysisDraft }),
      });
      const data = await res.json();
      if (res.ok) {
        setError(data.error);
        setAnalysisDraft("");
        toast.success("AI 分析已保存");
      } else {
        toast.error(data.error || "保存分析失败");
      }
    } catch {
      toast.error("保存分析失败");
    } finally {
      setSavingAnalysis(false);
    }
  }

  async function handleMasteryChange(level: string) {
    try {
      const res = await fetch(`/api/errors/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ masteryLevel: level }),
      });
      const data = await res.json();
      if (res.ok) {
        setError(data.error);
        setAnalysisDraft("");
        toast.success("掌握度已更新");
      }
    } catch {
      toast.error("更新失败");
    }
  }

  if (loading) {
    return (
      <DashboardPage>
        <EmptyStateCard
          title="错题详情加载中"
          description="正在加载这道题的完整内容、复习记录和 AI 分析能力。"
        />
      </DashboardPage>
    );
  }

  if (!error) return null;

  const images: string[] = JSON.parse(error.questionImages || "[]");
  const queryString = searchParams.toString();
  const withQuery = (targetId: string) =>
    `/errors/${targetId}${queryString ? `?${queryString}` : ""}`;

  return (
    <DashboardPage>
      <DashboardHero
        eyebrow="错题详情"
        title="查看这道题的完整复盘信息"
        description="这里包含题目内容、错误答案、解题分析、掌握状态与复习记录，你也可以继续编辑或触发 AI 分析。"
        actions={
          <>
            <Link href="/errors">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-1 h-4 w-4" />
                返回列表
              </Button>
            </Link>
            {neighbors.prev ? (
              <Link href={withQuery(neighbors.prev.id)}>
                <Button variant="outline" size="sm">
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  上一题
                </Button>
              </Link>
            ) : (
              <Button variant="outline" size="sm" disabled>
                <ArrowLeft className="mr-1 h-4 w-4" />
                上一题
              </Button>
            )}
            {neighbors.next ? (
              <Link href={withQuery(neighbors.next.id)}>
                <Button variant="outline" size="sm">
                  下一题
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <Button variant="outline" size="sm" disabled>
                下一题
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAnalysisOpen(true)}
              disabled={analyzing}
            >
              {analyzing ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <Bot className="mr-1 h-4 w-4" />
              )}
              {analyzing ? "AI 分析中..." : "AI 分析"}
            </Button>
            <Dialog open={analysisOpen} onOpenChange={(open) => !analyzing && setAnalysisOpen(open)}>
              <DialogContent showCloseButton={!analyzing}>
                <DialogHeader>
                  <DialogTitle>{analyzing ? "AI 正在分析" : "确认开始 AI 分析"}</DialogTitle>
                  <DialogDescription>
                    {analyzing
                      ? "请保持当前页面打开，分析完成前不要切换页面或刷新，以免请求中断。"
                      : "AI 分析可能需要一些时间。开始后请留在当前页面，分析结果会先作为草稿展示，完成后需要你审核内容并进入编辑页保存提交。"}
                  </DialogDescription>
                </DialogHeader>
                {analyzing ? (
                  <div className="flex items-center gap-3 rounded-[1rem] bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">
                    <Loader2 className="size-4 animate-spin" />
                    分析进行中，请勿离开当前页面。
                  </div>
                ) : null}
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setAnalysisOpen(false)}
                    disabled={analyzing}
                  >
                    取消
                  </Button>
                  <Button onClick={handleAIAnalysis} disabled={analyzing}>
                    {analyzing ? "分析中..." : "开始分析"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Link href={`/errors/${id}/edit`}>
              <Button variant="outline" size="sm">
                <Edit className="mr-1 h-4 w-4" />
                编辑
              </Button>
            </Link>
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
              <DialogTrigger render={<Button variant="destructive" size="sm" />}>
                <Trash2 className="mr-1 h-4 w-4" />
                删除
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>确认删除</DialogTitle>
                  <DialogDescription>删除后无法恢复，确定要删除这道错题吗？</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDeleteOpen(false)}>
                    取消
                  </Button>
                  <Button variant="destructive" onClick={handleDelete}>
                    确认删除
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        }
      />

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <SubjectTag subject={error.subject as "CHINESE" | "MATH" | "ENGLISH"} />
              {error.knowledgePoint ? <Badge variant="outline">{error.knowledgePoint.name}</Badge> : null}
              <Badge variant="secondary">
                {ERROR_SOURCES[error.source as keyof typeof ERROR_SOURCES]?.label}
              </Badge>
            </div>
            <MasteryBadge
              level={error.masteryLevel as "NOT_MASTERED" | "PARTIALLY_MASTERED" | "MASTERED"}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <SectionHeading title="题目内容" />
            <QuestionContent content={error.question} className="text-base leading-relaxed" />
            {images.length > 0 && (
              <div className="mt-2">
                <ImageLightboxGallery
                  images={images}
                  altPrefix="题目图片"
                  imageClassName="h-28 w-auto"
                />
              </div>
            )}
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-red-600 mb-2">错误答案</h3>
              {error.wrongAnswer ? (
                <QuestionContent content={error.wrongAnswer} className="text-sm" />
              ) : (
                <p className="text-sm text-muted-foreground">暂未填写</p>
              )}
            </div>
            <div>
              <h3 className="text-sm font-medium text-green-600 mb-2">正确答案</h3>
              {error.correctAnswer ? (
                <QuestionContent content={error.correctAnswer} className="text-sm" />
              ) : (
                <p className="text-sm text-muted-foreground">暂未订正</p>
              )}
            </div>
          </div>

          {error.errorReason && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">错误原因</h3>
                <QuestionContent content={error.errorReason} className="text-sm" />
              </div>
            </>
          )}

          {error.analysis && (
            <div>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-medium text-muted-foreground">AI 解题分析</h3>
                {analysisDraft ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSaveAnalysis}
                    disabled={savingAnalysis}
                  >
                    {savingAnalysis ? "保存中..." : "审核后保存"}
                  </Button>
                ) : (
                  <Link href={`/errors/${id}/edit`}>
                    <Button variant="outline" size="sm">编辑分析</Button>
                  </Link>
                )}
              </div>
              <div className="rounded-lg bg-muted/50 p-4">
                <MarkdownContent content={error.analysis} />
              </div>
            </div>
          )}

          <Separator />

          <div>
            <h3 className="text-sm font-medium mb-2">掌握度</h3>
            <div className="flex gap-2">
              {(["NOT_MASTERED", "PARTIALLY_MASTERED", "MASTERED"] as const).map(
                (level) => (
                  <Button
                    key={level}
                    size="sm"
                    variant={
                      error.masteryLevel === level ? "default" : "outline"
                    }
                    onClick={() => handleMasteryChange(level)}
                  >
                    {level === "NOT_MASTERED"
                      ? "未掌握"
                      : level === "PARTIALLY_MASTERED"
                        ? "部分掌握"
                        : "已掌握"}
                  </Button>
                )
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">复习间隔</span>
              <p className="font-medium">{error.interval} 天</p>
            </div>
            <div>
              <span className="text-muted-foreground">连续正确</span>
              <p className="font-medium">{error.repetitions} 次</p>
            </div>
            <div>
              <span className="text-muted-foreground">下次复习</span>
              <p className="font-medium">
                {format(new Date(error.nextReviewDate), "yyyy-MM-dd")}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">录入时间</span>
              <p className="font-medium">
                {format(new Date(error.createdAt), "yyyy-MM-dd")}
              </p>
            </div>
          </div>

          {error.reviews?.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-medium mb-2">复习记录</h3>
                <div className="space-y-1">
                  {error.reviews.map((review) => (
                    <div
                      key={review.id}
                      className="flex items-center justify-between text-sm py-1"
                    >
                      <Badge
                        variant="secondary"
                        className={
                          review.quality === "AGAIN"
                            ? "bg-red-100 text-red-700"
                            : review.quality === "HARD"
                              ? "bg-orange-100 text-orange-700"
                              : review.quality === "GOOD"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-green-100 text-green-700"
                        }
                      >
                        {review.quality === "AGAIN"
                          ? "完全不会"
                          : review.quality === "HARD"
                            ? "困难"
                            : review.quality === "GOOD"
                              ? "良好"
                              : "轻松"}
                      </Badge>
                      <span className="text-muted-foreground">
                        {format(new Date(review.createdAt), "yyyy-MM-dd HH:mm")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </DashboardPage>
  );
}
