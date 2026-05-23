"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Eye, Printer } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QuestionContent } from "@/components/common/question-content";
import { DashboardHero, DashboardPage, EmptyStateCard } from "@/components/layout/dashboard-shell";
import { SUBJECTS } from "@/lib/constants";

interface TestAnswer {
  id: string;
  error: {
    id: string;
    question: string;
    correctAnswer: string;
    analysis: string | null;
    subject: string;
  };
}

interface TestData {
  id: string;
  title: string | null;
  totalQuestions: number;
  startedAt: string;
  answers: TestAnswer[];
}

export default function TestPrintPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
  const [data, setData] = useState<TestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAnswers, setShowAnswers] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/test/${sessionId}`);
        const test = await res.json();
        if (res.ok) {
          setData(test);
        } else {
          toast.error(test.error || "加载试卷失败");
        }
      } catch {
        toast.error("加载试卷失败");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [sessionId]);

  if (loading) {
    return (
      <DashboardPage>
        <EmptyStateCard title="试卷加载中" description="正在整理题目和图片，请稍候。" />
      </DashboardPage>
    );
  }

  if (!data) return null;

  const firstSubject = data.answers[0]?.error.subject;
  const subjectLabel = firstSubject
    ? SUBJECTS[firstSubject as keyof typeof SUBJECTS]?.label || firstSubject
    : "综合";

  return (
    <DashboardPage className="print-page max-w-4xl">
      <div className="print-hidden">
        <DashboardHero
          eyebrow="打印试卷"
          title={data.title || "错题测试卷"}
          description="可直接打印，也可以在浏览器打印对话框中选择保存为 PDF。"
          actions={
            <>
              <Link href={`/test/${sessionId}`}>
                <Button variant="outline" size="sm">
                  <ArrowLeft className="mr-1 size-4" />
                  返回测试
                </Button>
              </Link>
              <Button
                variant={showAnswers ? "default" : "outline"}
                size="sm"
                onClick={() => setShowAnswers((current) => !current)}
              >
                <Eye className="mr-1 size-4" />
                {showAnswers ? "隐藏答案" : "含答案解析"}
              </Button>
              <Button size="sm" onClick={() => window.print()}>
                <Printer className="mr-1 size-4" />
                打印 / 保存 PDF
              </Button>
            </>
          }
        />
      </div>

      <article className="print-sheet rounded-[1.4rem] border border-white/80 bg-white/94 px-8 py-8 shadow-[0_18px_46px_rgba(59,101,176,0.08)]">
        <header className="text-center">
          <h1 className="text-3xl font-black tracking-[-0.04em] text-slate-950 print:text-[18pt]">
            {data.title || `${subjectLabel}错题测试卷`}
          </h1>
          <div className="mt-3 flex flex-wrap justify-center gap-2 text-sm text-slate-500 print:hidden">
            <Badge variant="outline">{subjectLabel}</Badge>
            <Badge variant="outline">{data.totalQuestions} 题</Badge>
            <Badge variant="outline">
              {format(new Date(data.startedAt), "yyyy-MM-dd")}
            </Badge>
            {showAnswers ? <Badge variant="secondary">含答案解析</Badge> : null}
          </div>
          <div className="mt-5 grid grid-cols-2 gap-x-8 gap-y-3 border-y border-slate-900 py-3 text-left text-sm text-slate-900 sm:grid-cols-4 print:grid-cols-4">
            <div>姓名：<span className="inline-block w-20 border-b border-slate-500" /></div>
            <div>班级：<span className="inline-block w-20 border-b border-slate-500" /></div>
            <div>日期：<span className="inline-block w-20 border-b border-slate-500" /></div>
            <div>得分：<span className="inline-block w-20 border-b border-slate-500" /></div>
          </div>
          <div className="mt-4 flex items-center justify-between border-b border-slate-300 pb-3 text-sm text-slate-600">
            <span>科目：{subjectLabel}</span>
            <span>题量：{data.totalQuestions} 题</span>
            <span>生成日期：{format(new Date(data.startedAt), "yyyy-MM-dd")}</span>
          </div>
        </header>

        <div className="mt-6 space-y-8">
          {data.answers.map((answer, index) => {
            return (
              <section key={answer.id} className="print-question break-inside-avoid border-b border-slate-200 pb-7">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h2 className="text-base font-bold text-slate-950">
                    第 {index + 1} 题
                  </h2>
                </div>

                <QuestionContent
                  content={answer.error.question}
                  className="text-base leading-8 text-slate-900 print:text-[11pt] print:leading-7"
                />

                {!showAnswers ? (
                  <div className="mt-5 space-y-3">
                    <div className="h-7 border-b border-slate-300" />
                    <div className="h-7 border-b border-slate-300" />
                    <div className="h-7 border-b border-slate-300" />
                    <div className="h-7 border-b border-slate-300" />
                  </div>
                ) : (
                  <div className="mt-5 space-y-3 border-l-4 border-slate-900 bg-slate-50/70 p-4 print:border-slate-700">
                    <div>
                      <h3 className="mb-1 text-sm font-bold text-slate-950">参考答案</h3>
                      <QuestionContent
                        content={answer.error.correctAnswer}
                        className="text-sm leading-7"
                      />
                    </div>
                    {answer.error.analysis ? (
                      <div>
                        <h3 className="mb-1 text-sm font-bold text-slate-950">解析</h3>
                        <QuestionContent
                          content={answer.error.analysis}
                          className="text-sm leading-7"
                        />
                      </div>
                    ) : null}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </article>
    </DashboardPage>
  );
}
