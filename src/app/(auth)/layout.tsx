import type { Metadata } from "next";
import { BookOpenText, ChartSpline, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "登录 - 错题记录",
  description: "登录你的错题记录账号",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="page-shell flex min-h-screen items-center justify-center px-4 py-10">
      <div className="relative z-10 grid w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/70 bg-white/70 shadow-[0_30px_80px_rgba(59,101,176,0.12)] backdrop-blur-2xl lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden overflow-hidden border-r border-white/70 bg-linear-to-br from-primary via-[#5e95ff] to-sky-300 px-10 py-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.22),transparent_25%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.18),transparent_24%)]" />
          <div className="relative">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/25 bg-white/12 px-4 py-2 backdrop-blur-md">
              <BookOpenText className="size-5" />
              <span className="text-sm font-semibold tracking-[0.16em] uppercase">
                错题记录
              </span>
            </div>
            <h1 className="mt-10 max-w-md text-5xl font-black leading-[1.06] tracking-[-0.06em]">
              把每一次失误，变成下一次提分的入口。
            </h1>
            <p className="mt-6 max-w-lg text-base leading-8 text-white/82">
              录入错题、识别知识点、安排复习节奏、追踪掌握进度，用一套统一的学习工作台把练习沉淀成真正的能力。
            </p>
          </div>

          <div className="relative grid gap-4 sm:grid-cols-3">
            <div className="rounded-[1.5rem] border border-white/18 bg-white/12 px-4 py-5 backdrop-blur-md">
              <Sparkles className="size-5 text-white/85" />
              <p className="mt-4 text-sm text-white/70">智能分析</p>
              <p className="mt-2 text-2xl font-black">AI OCR</p>
            </div>
            <div className="rounded-[1.5rem] border border-white/18 bg-white/12 px-4 py-5 backdrop-blur-md">
              <BookOpenText className="size-5 text-white/85" />
              <p className="mt-4 text-sm text-white/70">错题沉淀</p>
              <p className="mt-2 text-2xl font-black">结构化记录</p>
            </div>
            <div className="rounded-[1.5rem] border border-white/18 bg-white/12 px-4 py-5 backdrop-blur-md">
              <ChartSpline className="size-5 text-white/85" />
              <p className="mt-4 text-sm text-white/70">复习节奏</p>
              <p className="mt-2 text-2xl font-black">趋势可视化</p>
            </div>
          </div>
        </section>

        <section className="flex min-h-[720px] items-center justify-center bg-white/64 px-4 py-8 sm:px-6 lg:px-10">
          <div className="w-full max-w-md">
            <div className="mb-6 text-center lg:hidden">
              <div className="mx-auto flex size-14 items-center justify-center rounded-[1.2rem] bg-linear-to-br from-primary via-primary to-sky-400 text-white shadow-[0_18px_34px_rgba(58,114,224,0.24)]">
                <BookOpenText className="size-7" />
              </div>
              <h1 className="mt-4 text-2xl font-black tracking-[-0.04em] text-slate-950">
                错题记录
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                记录错题，科学复习，高效提升
              </p>
            </div>
            {children}
          </div>
        </section>
      </div>
    </div>
  );
}
