"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SubjectTag } from "@/components/common/subject-tag";
import { QuestionContent } from "@/components/common/question-content";
import { ImageLightboxGallery } from "@/components/common/image-lightbox-gallery";
import { REVIEW_QUALITIES } from "@/lib/constants";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { DashboardHero, DashboardPage, EmptyStateCard } from "@/components/layout/dashboard-shell";

interface ReviewItem {
  id: string;
  subject: string;
  question: string;
  questionImages: string;
  wrongAnswer: string;
  correctAnswer: string;
  analysis: string | null;
  masteryLevel: string;
  knowledgePoint: { id: string; name: string } | null;
}

export default function ReviewSessionPage() {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [finished, setFinished] = useState(false);
  const [results, setResults] = useState<
    { quality: string; errorId: string }[]
  >([]);

  useEffect(() => {
    async function loadReviewItems() {
      try {
        const res = await fetch("/api/review");
        const data = await res.json();
        const reviewItems = (data.items || []).filter(
          (item: { id: string }) => !results.some((r) => r.errorId === item.id)
        );
        setItems(reviewItems);
      } catch {
        toast.error("加载复习内容失败");
      } finally {
        setLoading(false);
      }
    }

    void loadReviewItems();
  }, [results]);

  async function handleQuality(quality: string) {
    if (!items[currentIndex]) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          errorId: items[currentIndex].id,
          quality,
        }),
      });

      if (res.ok) {
        const newResults = [...results, { quality, errorId: items[currentIndex].id }];
        setResults(newResults);

        if (currentIndex + 1 >= items.length) {
          setFinished(true);
        } else {
          setCurrentIndex(currentIndex + 1);
          setShowAnswer(false);
        }
      } else {
        toast.error("提交失败");
      }
    } catch {
      toast.error("提交失败");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <DashboardPage>
        <EmptyStateCard
          title="复习会话加载中"
          description="正在整理今天的复习题目，请稍候。"
        />
      </DashboardPage>
    );
  }

  if (items.length === 0 && !finished) {
    return (
      <DashboardPage>
        <EmptyStateCard
          title="没有需要复习的错题"
          description="今天的复习任务已经完成，你可以返回复习首页继续查看整体进度。"
          action={
            <Link href="/review">
              <Button>返回复习首页</Button>
            </Link>
          }
        />
      </DashboardPage>
    );
  }

  if (finished) {
    const qualityCounts = {
      AGAIN: results.filter((r) => r.quality === "AGAIN").length,
      HARD: results.filter((r) => r.quality === "HARD").length,
      GOOD: results.filter((r) => r.quality === "GOOD").length,
      EASY: results.filter((r) => r.quality === "EASY").length,
    };

    return (
      <DashboardPage className="max-w-3xl">
        <DashboardHero
          eyebrow="复习完成"
          title="本轮复习已结束"
          description="这里会展示这次复习中各掌握程度的分布情况，方便你快速判断接下来的练习重点。"
        />
        <Card>
          <CardContent className="py-8 text-center">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
            <h2 className="text-xl font-bold mb-2">复习完成</h2>
            <p className="text-muted-foreground">
              本次复习了 {results.length} 道错题
            </p>
            <div className="grid grid-cols-2 gap-3 mt-6 max-w-xs mx-auto">
              {Object.entries(qualityCounts).map(([quality, count]) => {
                const config = REVIEW_QUALITIES[quality as keyof typeof REVIEW_QUALITIES];
                return (
                  <div key={quality} className="text-center p-2 rounded bg-muted">
                    <div className={`h-3 w-3 rounded-full mx-auto mb-1 ${config.color}`} />
                    <p className="text-sm font-medium">{count} 题</p>
                    <p className="text-xs text-muted-foreground">{config.label}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
        <div className="flex gap-3 justify-center">
          <Link href="/review">
            <Button variant="outline">返回复习首页</Button>
          </Link>
          <Link href="/stats">
            <Button>查看统计</Button>
          </Link>
        </div>
      </DashboardPage>
    );
  }

  const current = items[currentIndex];
  const currentImages: string[] = JSON.parse(current.questionImages || "[]");

  return (
    <DashboardPage className="max-w-3xl">
      <DashboardHero
        eyebrow="进行中"
        title="专注完成当前复习题"
        description={`当前第 ${currentIndex + 1} / ${items.length} 题。先回忆答案，再结合解析判断自己的掌握程度。`}
        actions={
          <Link href="/review">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-1 h-4 w-4" />
              退出复习
            </Button>
          </Link>
        }
      />
      <Card>
        <CardContent className="py-6 space-y-4">
          <div className="flex items-center gap-2">
            <SubjectTag subject={current.subject as "CHINESE" | "MATH" | "ENGLISH"} />
            {current.knowledgePoint && (
              <span className="text-sm text-muted-foreground">
                {current.knowledgePoint.name}
              </span>
            )}
          </div>

          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">题目</h3>
            <QuestionContent
              content={current.question}
              className="text-base leading-relaxed"
            />
            {currentImages.length > 0 ? (
              <div className="mt-3">
                <p className="mb-2 text-xs font-medium tracking-[0.12em] text-slate-400 uppercase">
                  原始题图
                </p>
                <ImageLightboxGallery
                  images={currentImages}
                  altPrefix="复习题图"
                  imageClassName="h-24 w-auto"
                />
              </div>
            ) : null}
          </div>

          {!showAnswer ? (
            <Button className="w-full" onClick={() => setShowAnswer(true)}>
              显示答案
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="p-3 bg-green-50 rounded-md">
                <h4 className="text-sm font-medium text-green-700 mb-1">正确答案</h4>
                <QuestionContent content={current.correctAnswer} className="text-sm" />
              </div>

              <div className="p-3 bg-red-50 rounded-md">
                <h4 className="text-sm font-medium text-red-700 mb-1">我的错误答案</h4>
                <QuestionContent content={current.wrongAnswer} className="text-sm" />
              </div>

              {current.analysis && (
                <div className="p-3 bg-muted rounded-md">
                  <h4 className="text-sm font-medium mb-1">解题思路</h4>
                  <QuestionContent content={current.analysis} className="text-sm" />
                </div>
              )}

              <div>
                <h4 className="text-sm font-medium mb-2">你对这道题的掌握程度？</h4>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(REVIEW_QUALITIES).map(
                    ([quality, config]) => (
                      <Button
                        key={quality}
                        variant="outline"
                        className="h-auto py-3 flex flex-col items-center gap-1"
                        disabled={submitting}
                        onClick={() => handleQuality(quality)}
                      >
                        <div
                          className={`h-3 w-3 rounded-full ${config.color}`}
                        />
                        <span className="text-sm">{config.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {config.intervalNote}
                        </span>
                      </Button>
                    )
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardPage>
  );
}
