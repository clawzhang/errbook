"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SUBJECTS } from "@/lib/constants";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { DashboardHero, DashboardPage } from "@/components/layout/dashboard-shell";

export default function TestPage() {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [count, setCount] = useState("10");
  const [mode, setMode] = useState("RANDOM");
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    if (!subject) {
      toast.error("请选择科目");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          count: parseInt(count),
          mode,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "创建测试失败");
        return;
      }

      router.push(`/test/${data.sessionId}`);
    } catch {
      toast.error("创建测试失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardPage className="gap-3">
      <DashboardHero
        eyebrow="生成测试"
        title="从错题中抽取一场考核"
        description="选择学科、题量和出题模式，把错题重新变成可检验掌握情况的练习。"
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
        <CardHeader>
          <CardTitle className="text-base">测试配置</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>科目 *</Label>
            <Select value={subject} onValueChange={(v) => setSubject(v || "")}>
              <SelectTrigger>
                <SelectValue placeholder="选择科目">
                  {subject ? SUBJECTS[subject as keyof typeof SUBJECTS]?.label : null}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SUBJECTS).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>题目数量</Label>
            <Select value={count} onValueChange={(v) => setCount(v || "10")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[5, 10, 15, 20].map((n) => (
                  <SelectItem key={n} value={n.toString()}>
                    {n} 题
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>出题模式</Label>
            <Select value={mode} onValueChange={(v) => setMode(v || "RANDOM")}>
              <SelectTrigger>
                <SelectValue placeholder="出题模式">
                  {mode === "RANDOM" ? "随机抽题" : mode === "WEAKEST" ? "薄弱优先" : null}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="RANDOM">随机抽题</SelectItem>
                <SelectItem value="WEAKEST">薄弱优先</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {mode === "RANDOM"
                ? "从符合条件的错题中随机抽取"
                : "按掌握度从低到高排序，优先测试未掌握的题目"}
            </p>
          </div>

          <Button
            className="w-full"
            onClick={handleCreate}
            disabled={loading || !subject}
          >
            {loading ? "生成中..." : "生成测试"}
          </Button>
        </CardContent>
      </Card>
    </DashboardPage>
  );
}
