"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SubjectTag } from "@/components/common/subject-tag";
import { QuestionContent } from "@/components/common/question-content";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Printer,
  XCircle,
} from "lucide-react";
import { DashboardHero, DashboardPage, EmptyStateCard } from "@/components/layout/dashboard-shell";
import { Textarea } from "@/components/ui/textarea";

interface TestAnswer {
  id: string;
  userAnswer: string | null;
  isCorrect: boolean;
  repeatWrongCount: number;
  error: {
    id: string;
    question: string;
    wrongAnswer: string;
    correctAnswer: string;
    analysis: string | null;
    subject: string;
  };
}

interface TestData {
  id: string;
  title: string | null;
  status: string;
  totalQuestions: number;
  correctCount: number;
  answers: TestAnswer[];
}

interface GradeResult {
  answerId: string;
  isCorrect: boolean;
  comment: string;
}

export default function TestSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
  const router = useRouter();
  const [data, setData] = useState<TestData | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [gradeResults, setGradeResults] = useState<GradeResult[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/test/${sessionId}`);
        const test = await res.json();
        if (res.ok) {
          setData(test);
          if (test.status === "COMPLETED") {
            const existingAnswers: Record<string, string> = {};
            for (const a of test.answers) {
              if (a.userAnswer) existingAnswers[a.id] = a.userAnswer;
            }
            setUserAnswers(existingAnswers);
            setGradeResults(
              test.answers.map((a: TestAnswer) => ({
                answerId: a.id,
                isCorrect: a.isCorrect,
                comment: "",
              }))
            );
          }
        } else {
          toast.error("加载测试失败");
          router.push("/tests");
        }
      } catch {
        toast.error("加载失败");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [sessionId, router]);

  function handleAnswer(answerId: string, value: string) {
    setUserAnswers((prev) => ({ ...prev, [answerId]: value }));
  }

  async function handleSubmit() {
    if (!data) return;
    setSubmitting(true);

    try {
      const answers = data.answers.map((a) => ({
        answerId: a.id,
        userAnswer: userAnswers[a.id] || "",
      }));

      const res = await fetch(`/api/test/${sessionId}/grade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });

      const result = await res.json();

      if (res.ok) {
        setGradeResults(result.results);
        setData((prev) =>
          prev
            ? {
                ...prev,
                status: "COMPLETED",
                correctCount: result.correctCount,
              }
            : null
        );
        toast.success("测试已提交，AI 打分完成");
      } else {
        toast.error(result.error || "提交失败");
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
          title="测试内容加载中"
          description="正在读取本场测试的题目与答题状态，请稍候。"
        />
      </DashboardPage>
    );
  }

  if (!data) return null;

  const isCompleted = data.status === "COMPLETED" && gradeResults.length > 0;

  if (isCompleted) {
    const accuracy =
      data.totalQuestions > 0
        ? Math.round((data.correctCount / data.totalQuestions) * 100)
        : 0;

    return (
      <DashboardPage className="gap-3">
        <DashboardHero
          eyebrow="测试结果"
          title="本场测试已完成"
          description="AI 已完成打分，查看每道题的判定结果。错误的题目可以跳转到原始错题记录。"
          actions={
            <Link href="/tests">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-1 h-4 w-4" />
                返回考试记录
              </Button>
            </Link>
          }
        />
        <Card>
          <CardContent className="py-8 text-center">
            <div className="mb-2 text-4xl font-black text-slate-950">{accuracy}%</div>
            <p className="text-muted-foreground">
              正确 {data.correctCount} / {data.totalQuestions} 题
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 py-5">
            {data.answers.map((answer, i) => {
              const result = gradeResults.find((r) => r.answerId === answer.id);
              const isCorrect = result?.isCorrect ?? answer.isCorrect;
              return (
                <div
                  key={answer.id}
                  className={`rounded-[1.25rem] border px-4 py-4 ${
                    isCorrect
                      ? "border-green-200 bg-green-50/50"
                      : "border-red-200 bg-red-50/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2 min-w-0 flex-1">
                      {isCorrect ? (
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                      ) : (
                        <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-900">
                          第 {i + 1} 题
                        </p>
                        <p className="mt-1 text-sm text-slate-600 line-clamp-2">
                          {answer.error.question.slice(0, 80)}
                          {answer.error.question.length > 80 ? "..." : ""}
                        </p>
                        {result?.comment && (
                          <p className="mt-1 text-xs text-slate-500">
                            AI 点评：{result.comment}
                          </p>
                        )}
                        {!isCorrect && answer.repeatWrongCount > 1 && (
                          <Badge variant="destructive" className="mt-2 text-xs">
                            重复错误 {answer.repeatWrongCount} 次
                          </Badge>
                        )}
                      </div>
                    </div>
                    {!isCorrect && (
                      <Link href={`/errors/${answer.error.id}`}>
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="mr-1 h-3.5 w-3.5" />
                          查看错题
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <div className="flex justify-center gap-3">
          <Link href="/tests">
            <Button variant="outline">返回考试记录</Button>
          </Link>
          <Link href={`/test/${sessionId}/print`}>
            <Button variant="outline">
              <Printer className="mr-1 size-4" />
              打印试卷
            </Button>
          </Link>
          <Link href="/test">
            <Button>再来一场</Button>
          </Link>
        </div>
      </DashboardPage>
    );
  }

  // 答题进行中
  const current = data.answers[currentIndex];
  const answeredCount = Object.keys(userAnswers).filter(
    (k) => userAnswers[k].trim().length > 0
  ).length;
  const allAnswered = answeredCount === data.answers.length;

  return (
    <DashboardPage className="gap-3">
      <DashboardHero
        eyebrow="进行中"
        title={data.title || "错题测试"}
        description={`当前第 ${currentIndex + 1} / ${data.totalQuestions} 题，已作答 ${answeredCount} 题。完成全部作答后统一提交 AI 打分。`}
        actions={
          <>
            <Link href="/tests">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-1 h-4 w-4" />
                退出测试
              </Button>
            </Link>
            <Link href={`/test/${sessionId}/print`}>
              <Button variant="outline" size="sm">
                <Printer className="mr-1 h-4 w-4" />
                打印试卷
              </Button>
            </Link>
          </>
        }
      />

      {current ? (
        <Card>
          <CardContent className="space-y-5 py-6">
            <div className="flex items-center gap-2">
              <SubjectTag
                subject={current.error.subject as "CHINESE" | "MATH" | "ENGLISH"}
              />
              <span className="text-sm text-muted-foreground">
                第 {currentIndex + 1} / {data.totalQuestions} 题
              </span>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-medium text-muted-foreground">题目</h3>
              <QuestionContent
                content={current.error.question}
                className="text-base leading-relaxed"
              />
            </div>

            <div>
              <h4 className="mb-1 text-sm font-medium">你的答案</h4>
              <Textarea
                placeholder="输入你的答案..."
                value={userAnswers[current.id] || ""}
                onChange={(e) => handleAnswer(current.id, e.target.value)}
                rows={4}
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <Button
                variant="outline"
                onClick={() => setCurrentIndex(currentIndex - 1)}
                disabled={currentIndex === 0}
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                上一题
              </Button>

              <div className="flex gap-1.5 flex-wrap justify-center">
                {data.answers.map((a, i) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setCurrentIndex(i)}
                    className={`h-7 w-7 rounded-full text-xs font-medium transition ${
                      i === currentIndex
                        ? "bg-primary text-white"
                        : userAnswers[a.id]?.trim()
                          ? "bg-green-100 text-green-700"
                          : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              {currentIndex + 1 < data.answers.length ? (
                <Button onClick={() => setCurrentIndex(currentIndex + 1)}>
                  下一题
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={submitting || !allAnswered}
                >
                  {submitting ? "AI 打分中..." : "提交测试"}
                </Button>
              )}
            </div>

            {currentIndex + 1 === data.answers.length && !allAnswered && (
              <p className="text-center text-sm text-amber-600">
                还有 {data.answers.length - answeredCount} 题未作答，请全部完成后再提交
              </p>
            )}
          </CardContent>
        </Card>
      ) : null}
    </DashboardPage>
  );
}
