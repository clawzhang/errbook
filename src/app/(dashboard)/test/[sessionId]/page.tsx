"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SubjectTag } from "@/components/common/subject-tag";
import { QuestionContent } from "@/components/common/question-content";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, Printer, XCircle } from "lucide-react";
import Link from "next/link";
import { use } from "react";
import { DashboardHero, DashboardPage, EmptyStateCard } from "@/components/layout/dashboard-shell";
import { Textarea } from "@/components/ui/textarea";

interface TestAnswer {
  id: string;
  userAnswer: string | null;
  isCorrect: boolean;
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
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [correctMap, setCorrectMap] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/test/${sessionId}`);
        const test = await res.json();
        if (res.ok) {
          setData(test);
          if (test.status === "COMPLETED") {
            setFinished(true);
          }
        } else {
          toast.error("加载测试失败");
          router.push("/test");
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

  function handleReveal(answerId: string) {
    setRevealed((prev) => ({ ...prev, [answerId]: true }));
  }

  function handleJudge(answerId: string, isCorrect: boolean) {
    setCorrectMap((prev) => ({ ...prev, [answerId]: isCorrect }));
  }

  async function handleSubmit() {
    if (!data) return;
    setSubmitting(true);

    try {
      const answers = data.answers.map((a) => ({
        answerId: a.id,
        userAnswer: userAnswers[a.id] || "",
        isCorrect: correctMap[a.id] ?? false,
        timeSpent: null,
      }));

      const res = await fetch(`/api/test/${sessionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });

      const result = await res.json();

      if (res.ok) {
        setFinished(true);
        setData((prev) =>
          prev
            ? {
                ...prev,
                status: "COMPLETED",
                correctCount: result.correctCount,
              }
            : null
        );
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
          title="测试内容加载中"
          description="正在读取本场测试的题目与答题状态，请稍候。"
        />
      </DashboardPage>
    );
  }

  if (!data) return null;

  if (finished) {
    const accuracy =
      data.totalQuestions > 0
        ? Math.round((data.correctCount / data.totalQuestions) * 100)
        : 0;

    return (
      <DashboardPage className="gap-3">
        <DashboardHero
          eyebrow="测试结果"
          title="本场测试已完成"
          description="这里会展示本次测试的总体正确率，以及每道题的大致答题结果。"
        />
        <Card>
          <CardContent className="py-8 text-center">
            <h2 className="mb-4 text-xl font-bold">测试完成</h2>
            <div className="mb-2 text-4xl font-black text-slate-950">{accuracy}%</div>
            <p className="text-muted-foreground">
              正确 {data.correctCount} / {data.totalQuestions} 题
            </p>

            <div className="mt-6 space-y-2 text-left">
              {data.answers.map((answer, i) => (
                <div
                  key={answer.id}
                  className="flex items-center gap-2 rounded-[1rem] bg-muted px-3 py-3"
                >
                  {correctMap[answer.id] ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 shrink-0 text-red-500" />
                  )}
                  <span className="truncate text-sm">
                    第{i + 1}题：{(answer.error.question || "").slice(0, 50)}...
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center gap-3">
          <Link href="/test">
            <Button variant="outline">返回测试</Button>
          </Link>
          <Link href={`/test/${sessionId}/print`}>
            <Button variant="outline">
              <Printer className="mr-1 size-4" />
              打印试卷
            </Button>
          </Link>
          <Link href="/review">
            <Button>开始复习</Button>
          </Link>
        </div>
      </DashboardPage>
    );
  }

  const current = data.answers[currentIndex];
  return (
    <DashboardPage className="gap-3">
      <DashboardHero
        eyebrow="进行中"
        title={data.title || "错题测试"}
        description={`当前第 ${currentIndex + 1} / ${data.totalQuestions} 题。先独立作答，再查看答案并判断自己的掌握情况。`}
        actions={
          <>
            <Link href="/test">
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
                第 {currentIndex + 1} 题
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
              />
            </div>

            {!revealed[current.id] ? (
              <Button className="w-full" variant="outline" onClick={() => handleReveal(current.id)}>
                查看正确答案
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="rounded-[1.25rem] bg-green-50 p-4">
                  <h4 className="mb-1 text-sm font-medium text-green-700">正确答案</h4>
                  <QuestionContent
                    content={current.error.correctAnswer}
                    className="text-sm"
                  />
                </div>

                {current.error.analysis ? (
                  <div className="rounded-[1.25rem] bg-muted p-4">
                    <h4 className="mb-1 text-sm font-medium">解析</h4>
                    <QuestionContent
                      content={current.error.analysis}
                      className="text-sm"
                    />
                  </div>
                ) : null}

                <div>
                  <h4 className="mb-2 text-sm font-medium">你答对了吗？</h4>
                  <div className="flex gap-2">
                    <Button
                      variant={correctMap[current.id] === false ? "destructive" : "outline"}
                      onClick={() => handleJudge(current.id, false)}
                    >
                      <XCircle className="mr-1 h-4 w-4" />
                      答错了
                    </Button>
                    <Button
                      variant={correctMap[current.id] === true ? "default" : "outline"}
                      onClick={() => handleJudge(current.id, true)}
                    >
                      <CheckCircle2 className="mr-1 h-4 w-4" />
                      答对了
                    </Button>
                  </div>
                </div>

                {currentIndex + 1 < data.answers.length ? (
                  <Button
                    className="w-full"
                    onClick={() => setCurrentIndex(currentIndex + 1)}
                    disabled={correctMap[current.id] === undefined}
                  >
                    下一题
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    onClick={handleSubmit}
                    disabled={submitting || Object.keys(correctMap).length < data.answers.length}
                  >
                    {submitting ? "提交中..." : "提交测试"}
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}
    </DashboardPage>
  );
}
