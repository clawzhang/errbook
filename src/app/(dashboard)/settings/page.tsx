"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  GraduationCap,
  Bot,
  User,
  Lock,
  Info,
} from "lucide-react";
import { getGradeOptions, getSemesterOptions, GRADE_LABELS, SEMESTER_LABELS } from "@/lib/grade";
import { DashboardHero, DashboardPage } from "@/components/layout/dashboard-shell";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [name, setName] = useState(session?.user?.name || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // 年级学期
  const [grade, setGrade] = useState("1");
  const [semester, setSemester] = useState("FIRST");
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [currentGradeLabel, setCurrentGradeLabel] = useState("");
  const [gradeSaving, setGradeSaving] = useState(false);

  // AI 配置
  const [aiBaseUrl, setAiBaseUrl] = useState("");
  const [aiApiKey, setAiApiKey] = useState("");
  const [aiModel, setAiModel] = useState("");
  const [aiSaving, setAiSaving] = useState(false);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [fetchingModels, setFetchingModels] = useState(false);
  const [modelsFetched, setModelsFetched] = useState(false);

  const gradeOptions = getGradeOptions();
  const semesterOptions = getSemesterOptions();

  useEffect(() => {
    // 加载年级设置
    fetch("/api/grade")
      .then((r) => r.json())
      .then((d) => {
        setGrade(d.baseGrade?.toString() || d.currentGrade?.toString() || "1");
        setSemester(d.baseSemester || d.currentSemester || "FIRST");
        setAutoAdvance(d.autoAdvance ?? true);
        setCurrentGradeLabel(d.currentLabel || "");
      })
      .catch(() => {});

    // 加载 AI 配置
    fetch("/api/ai/config")
      .then((r) => r.json())
      .then((d) => {
        setAiBaseUrl(d.baseUrl || "");
        setAiApiKey(d.apiKey || "");
        setAiModel(d.model || "");
      })
      .catch(() => {});
  }, []);

  async function handleNameUpdate(e: React.FormEvent) {
    e.preventDefault();
    toast.success("用户名更新功能开发中");
  }

  async function handlePasswordUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("两次密码输入不一致");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("密码至少6位");
      return;
    }
    toast.success("密码修改功能开发中");
  }

  async function handleGradeSave(e: React.FormEvent) {
    e.preventDefault();
    setGradeSaving(true);

    try {
      const payload = {
        currentGrade: parseInt(grade),
        currentSemester: semester,
        autoAdvance,
      };
      const res = await fetch("/api/grade", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("年级设置已保存");
        setGrade(data.baseGrade?.toString() || grade);
        setSemester(data.baseSemester || semester);
        setAutoAdvance(data.autoAdvance ?? autoAdvance);
        setCurrentGradeLabel(data.currentLabel || "");
      } else {
        toast.error(data.error || "保存失败");
      }
    } catch {
      toast.error("保存失败");
    } finally {
      setGradeSaving(false);
    }
  }

  async function handleAiSave(e: React.FormEvent) {
    e.preventDefault();
    setAiSaving(true);

    try {
      const res = await fetch("/api/ai/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseUrl: aiBaseUrl,
          apiKey: aiApiKey,
          model: aiModel,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("AI 配置已保存");
      } else {
        toast.error(data.error || "保存失败");
      }
    } catch {
      toast.error("保存失败");
    } finally {
      setAiSaving(false);
    }
  }

  async function handleFetchModels() {
    if (!aiBaseUrl || !aiApiKey) {
      toast.error("请先填写 API Base URL 和 API Key");
      return;
    }

    setFetchingModels(true);
    try {
      const res = await fetch("/api/ai/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseUrl: aiBaseUrl,
          apiKey: aiApiKey,
        }),
      });

      const data = await res.json();

      if (data.supported && data.models) {
        setAvailableModels(data.models);
        setModelsFetched(true);
        toast.success(`已获取 ${data.models.length} 个可用模型`);
      } else {
        toast.error(data.error || "该 API 不支持自动获取模型列表，请手动输入");
        setModelsFetched(false);
      }
    } catch {
      toast.error("获取模型列表失败");
      setModelsFetched(false);
    } finally {
      setFetchingModels(false);
    }
  }

  return (
    <DashboardPage>
      <DashboardHero
        eyebrow="设置中心"
        title="管理账号、年级与 AI 配置"
        description="这一页集中放置你的学习阶段、账号信息、AI 接入和安全设置，是整个系统的基础配置中心。"
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* 左列 */}
        <div className="space-y-4">
          {/* 年级学期 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                年级与学期
              </CardTitle>
              <CardDescription>
                设置你目前所在的年级和学期，后续录入的错题将自动归类到该年级学期下
              </CardDescription>
              {currentGradeLabel && (
                <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary/10 text-primary text-sm">
                  <GraduationCap className="h-3.5 w-3.5" />
                  当前：{currentGradeLabel}
                </div>
              )}
            </CardHeader>
            <CardContent>
              <form onSubmit={handleGradeSave} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>年级</Label>
                    <Select value={grade} onValueChange={(v) => v && setGrade(v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="选择年级">
                          {grade ? GRADE_LABELS[parseInt(grade)] : null}
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
                    <Select value={semester} onValueChange={(v) => v && setSemester(v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="选择学期">
                          {semester ? SEMESTER_LABELS[semester as keyof typeof SEMESTER_LABELS] : null}
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

                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <Label className="text-sm">自动晋级</Label>
                    <p className="text-xs text-muted-foreground">
                      每年2月和9月自动切换学期/升级
                    </p>
                  </div>
                  <Switch
                    checked={autoAdvance}
                    onCheckedChange={setAutoAdvance}
                  />
                </div>

                <div className="rounded-lg border p-3 bg-muted/30">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>开启自动晋级后，系统会在每年的学期切换节点自动计算你的当前年级：</p>
                      <p><strong>9月</strong> → 升入新学年上学期（年级+1）</p>
                      <p><strong>2月</strong> → 进入下学期（年级不变）</p>
                    </div>
                  </div>
                </div>

                <Button type="submit" disabled={gradeSaving} size="sm">
                  {gradeSaving ? "保存中..." : "保存年级设置"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* 基本信息 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" />
                基本信息
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleNameUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label>邮箱</Label>
                  <Input value={session?.user?.email || ""} disabled />
                </div>
                <div className="space-y-2">
                  <Label>用户名</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <Button type="submit" size="sm">
                  保存
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* 右列 */}
        <div className="space-y-4">
          {/* AI 配置 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Bot className="h-4 w-4" />
                AI 助手配置
              </CardTitle>
              <CardDescription>
                配置 AI 大模型 API，启用错题分析、总结等智能功能
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAiSave} className="space-y-4">
                <div className="space-y-2">
                  <Label>API Base URL</Label>
                  <Input
                    placeholder="https://api.deepseek.com"
                    value={aiBaseUrl}
                    onChange={(e) => setAiBaseUrl(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>API Key</Label>
                  <Input
                    type="password"
                    placeholder="sk-..."
                    value={aiApiKey}
                    onChange={(e) => setAiApiKey(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>模型名称</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleFetchModels}
                      disabled={fetchingModels || !aiBaseUrl || !aiApiKey}
                    >
                      {fetchingModels ? "获取中..." : "获取模型列表"}
                    </Button>
                  </div>
                  {modelsFetched && availableModels.length > 0 ? (
                    <Select value={aiModel} onValueChange={(v) => v && setAiModel(v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="选择模型">
                          {aiModel || null}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {availableModels.map((model) => (
                          <SelectItem key={model} value={model}>
                            {model}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      placeholder="deepseek-chat"
                      value={aiModel}
                      onChange={(e) => setAiModel(e.target.value)}
                    />
                  )}
                </div>

                <div className="rounded-lg border p-3 bg-muted/30">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>支持兼容 OpenAI 格式的 API，如：</p>
                      <p>• DeepSeek: https://api.deepseek.com</p>
                      <p>• 硅基流动: https://api.siliconflow.cn/v1</p>
                      <p>• Ollama: http://localhost:11434/v1</p>
                    </div>
                  </div>
                </div>

                <Button type="submit" disabled={aiSaving} size="sm">
                  {aiSaving ? "保存中..." : "保存 AI 配置"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* 修改密码 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Lock className="h-4 w-4" />
                修改密码
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label>当前密码</Label>
                  <Input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>新密码</Label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label>确认新密码</Label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" size="sm">
                  修改密码
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardPage>
  );
}
