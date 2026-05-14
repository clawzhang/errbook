import { cn } from "@/lib/utils";
import { ArrowUpRight, type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function DashboardPage({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("mx-auto flex w-full max-w-[1320px] flex-col gap-4", className)}>
      {children}
    </div>
  );
}

export function DashboardHero({
  eyebrow,
  title,
  description,
  actions,
  aside,
  showIntro = false,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  aside?: React.ReactNode;
  showIntro?: boolean;
}) {
  if (!showIntro) {
    if (!actions && !aside) return null;

    return (
      <section className="dashboard-panel px-4 py-3 md:px-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {actions ? <div className="flex flex-wrap items-center gap-2.5">{actions}</div> : null}
          {aside ? <div className="relative lg:min-w-[300px]">{aside}</div> : null}
        </div>
      </section>
    );
  }

  return (
    <section className="dashboard-panel relative overflow-hidden px-5 py-5 md:px-6 md:py-6">
      <div className="absolute inset-y-0 right-0 w-1/2 bg-linear-to-l from-blue-100/45 via-sky-50/20 to-transparent" />
      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-3xl">
          {eyebrow ? (
            <div className="mb-3">
              <Badge variant="outline" className="rounded-full border-white/80 bg-white/72 px-3 py-0.5 text-[0.68rem] font-semibold tracking-[0.18em] text-slate-500 uppercase">
                {eyebrow}
              </Badge>
            </div>
          ) : null}
          <h1 className="text-2xl font-black tracking-[-0.05em] text-slate-950 md:text-[2.35rem]">
            {title}
          </h1>
          {description ? (
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 md:text-[0.96rem] md:leading-7">
              {description}
            </p>
          ) : null}
          {actions ? <div className="mt-4 flex flex-wrap items-center gap-2.5">{actions}</div> : null}
        </div>
        {aside ? <div className="relative lg:min-w-[300px]">{aside}</div> : null}
      </div>
    </section>
  );
}

export function SectionHeading({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2.5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="dashboard-section-title">{title}</h2>
        {description ? <p className="dashboard-section-desc mt-1.5">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function MetricCard({
  title,
  value,
  hint,
  trend,
  icon: Icon,
  iconTint,
}: {
  title: string;
  value: React.ReactNode;
  hint?: string;
  trend?: string;
  icon: LucideIcon;
  iconTint?: string;
}) {
  return (
    <Card className="h-full border-white/80 bg-white/92 shadow-[0_18px_40px_rgba(47,100,190,0.08)]">
      <CardContent className="flex h-full flex-col gap-3 p-3.5 md:p-4">
        <div className="flex items-start justify-between gap-3">
          <div
            className={cn(
              "flex size-10 items-center justify-center rounded-[0.95rem] border border-white/80 bg-blue-50 text-primary shadow-[0_10px_20px_rgba(79,128,212,0.1)]",
              iconTint
            )}
          >
            <Icon className="size-4.5" />
          </div>
          {trend ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[0.72rem] font-semibold text-emerald-600">
              <ArrowUpRight className="size-3.5" />
              {trend}
            </span>
          ) : null}
        </div>
        <div>
          <p className="text-[0.82rem] font-semibold text-slate-500">{title}</p>
          <p className="mt-1 text-[1.75rem] font-black tracking-[-0.04em] text-slate-950 md:text-[1.95rem]">
            {value}
          </p>
          {hint ? <p className="mt-1.5 text-[0.82rem] text-muted-foreground">{hint}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}

export function GlassMiniCard({
  title,
  value,
  description,
}: {
  title: string;
  value: React.ReactNode;
  description?: string;
}) {
  return (
    <div className="rounded-[1.2rem] border border-white/80 bg-white/72 px-3 py-2.5 shadow-[0_10px_24px_rgba(59,101,176,0.07)] backdrop-blur-md">
      <p className="text-[0.68rem] font-semibold tracking-[0.18em] text-slate-400 uppercase">{title}</p>
      <p className="mt-1.5 text-lg font-black tracking-[-0.03em] text-slate-950">{value}</p>
      {description ? <p className="mt-0.5 text-[0.82rem] text-slate-500">{description}</p> : null}
    </div>
  );
}

export function EmptyStateCard({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="dashboard-empty py-10">
      <div className="mb-3 flex size-14 items-center justify-center rounded-[1.4rem] bg-blue-50 text-primary shadow-[0_12px_28px_rgba(79,128,212,0.1)]">
        <span className="text-xl">✦</span>
      </div>
      <h3 className="text-base font-bold text-slate-900">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
