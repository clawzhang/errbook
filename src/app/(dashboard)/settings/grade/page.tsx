"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { GraduationCap, Info } from "lucide-react";
import { getGradeOptions, getSemesterOptions, GRADE_LABELS, SEMESTER_LABELS } from "@/lib/grade";
import { DashboardHero, DashboardPage, EmptyStateCard } from "@/components/layout/dashboard-shell";

export default function GradeSettingsPage() {
  const [baseGrade, setBaseGrade] = useState("1");
  const [baseSemester, setBaseSemester] = useState("FIRST");
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [currentLabel, setCurrentLabel] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const gradeOptions = getGradeOptions();
  const semesterOptions = getSemesterOptions();

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/grade");
        const data = await res.json();
        setBaseGrade(data.baseGrade?.toString() || data.currentGrade?.toString() || "1");
        setBaseSemester(data.baseSemester || data.currentSemester || "FIRST");
        setAutoAdvance(data.autoAdvance ?? true);
        setCurrentLabel(data.currentLabel || "");
      } catch {
        toast.error("加载年级设置失败");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch("/api/grade", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentGrade: parseInt(baseGrade),
          currentSemester: baseSemester,
          autoAdvance,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("年级设置已保存");
        setBaseGrade(data.baseGrade?.toString() || baseGrade);
        setBaseSemester(data.baseSemester || baseSemester);
        setAutoAdvance(data.autoAdvance ?? autoAdvance);
        setCurrentLabel(data.currentLabel || "");
      } else {
        toast.error(data.error || "保存失败");
      }
    } catch {
      toast.error("保存失败");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <DashboardPage>
        <EmptyStateCard
          title="年级设置加载中"
          description="正在读取当前学习阶段设置，请稍候。"
        />
      </DashboardPage>
    );
  }

  return (
    <DashboardPage className="max-w-4xl gap-4">
      <DashboardHero
        eyebrow="学习阶段"
        title="设置当前年级与学期"
        description="系统会根据这里的设置为新录入错题自动归档，并据此计算自动晋级后的学习阶段。"
      />

      {currentLabel && (
        <Card className="border-primary/15 bg-primary/5">
          <CardContent className="flex items-center gap-2 px-4 py-3">
            <GraduationCap className="h-4 w-4 text-primary" />
            <span className="text-sm">
              当前年级：<strong>{currentLabel}</strong>
            </span>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">设置当前年级</CardTitle>
          <CardDescription>
            设置你目前所在的年级和学期，后续录入的错题将自动归类到该年级学期下。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>年级</Label>
                <Select value={baseGrade} onValueChange={(v) => v && setBaseGrade(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择年级">
                      {baseGrade ? GRADE_LABELS[parseInt(baseGrade)] : null}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {gradeOptions.map(({ value, label }) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>学期</Label>
                <Select value={baseSemester} onValueChange={(v) => v && setBaseSemester(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择学期">
                      {baseSemester ? SEMESTER_LABELS[baseSemester as keyof typeof SEMESTER_LABELS] : null}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {semesterOptions.map(({ value, label }) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-3">
              <div className="space-y-0.5">
                <Label className="text-sm">自动晋级</Label>
                <p className="text-xs text-muted-foreground">每年2月和9月自动切换学期/升级</p>
              </div>
              <Switch checked={autoAdvance} onCheckedChange={setAutoAdvance} />
            </div>

            <div className="rounded-lg border bg-muted/30 p-3">
              <div className="flex items-start gap-2">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p>9月：升入新学年上学期，年级 +1。</p>
                  <p>2月：进入下学期，年级保持不变。</p>
                </div>
              </div>
            </div>

            <Button type="submit" disabled={saving} size="sm">
              {saving ? "保存中..." : "保存年级设置"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-1 text-sm">
            <Info className="h-3.5 w-3.5" />
            自动晋级规则说明
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>系统以你保存的年级和学期为基准，按当前日期自动推导实际学习阶段。</p>
          <ul className="list-disc space-y-1 pl-4">
            <li><strong>9月</strong> → 新学年上学期，年级 +1。</li>
            <li><strong>2月</strong> → 下学期，年级不变。</li>
          </ul>
          <p>如果你留级或跳级，可以直接重新保存基准值。</p>
        </CardContent>
      </Card>
    </DashboardPage>
  );
}
