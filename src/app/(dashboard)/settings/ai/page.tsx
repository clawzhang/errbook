"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { DashboardHero, DashboardPage, EmptyStateCard } from "@/components/layout/dashboard-shell";

export default function AISettingsPage() {
  const [baseUrl, setBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const [apiKeyConfigured, setApiKeyConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/ai/config");
        const data = await res.json();
        setBaseUrl(data.baseUrl || "");
        setApiKey(data.apiKey || "");
        setModel(data.model || "");
        setApiKeyConfigured(Boolean(data.apiKey));
      } catch {
        toast.error("加载配置失败");
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
      const body: Record<string, string> = {
        baseUrl,
        model,
      };

      if (apiKey) {
        body.apiKey = apiKey;
      } else if (!apiKeyConfigured) {
        toast.error("请输入 API Key");
        return;
      }

      const res = await fetch("/api/ai/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("AI 配置已保存");
        setApiKeyConfigured(true);
        setApiKey("");
      } else {
        toast.error(data.error || "保存失败");
      }
    } catch {
      toast.error("保存失败");
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    if (!baseUrl || !apiKey || !model) {
      toast.error("请先填写 API Base URL、API Key 和模型名称");
      return;
    }

    setTesting(true);
    try {
      const res = await fetch("/api/ai/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseUrl,
          apiKey,
        }),
      });
      const data = await res.json();

      if (res.ok || data.supported === false) {
        toast.success("AI 服务配置可用");
      } else {
        toast.error(data.error || "AI 服务连接失败");
      }
    } catch {
      toast.error("AI 服务连接失败");
    } finally {
      setTesting(false);
    }
  }

  if (loading) {
    return (
      <DashboardPage>
        <EmptyStateCard
          title="AI 配置加载中"
          description="正在读取当前 AI 服务接入信息，请稍候。"
        />
      </DashboardPage>
    );
  }

  return (
    <DashboardPage className="max-w-4xl gap-4">
      <DashboardHero
        eyebrow="AI 接入"
        title="配置 AI 服务能力"
        description="配置完成后，可以支持错题图片识别、错题分析和学习建议总结等能力。"
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">大模型接入</CardTitle>
          <CardDescription>
            配置 AI 大模型后，可以自动识别错题图片、分析错题原因、归纳总结薄弱点。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label>API Base URL *</Label>
              <Input
                placeholder="https://api.openai.com/v1"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                兼容 OpenAI 格式的 API 地址，如 OpenAI、DeepSeek、硅基流动、本地 Ollama 等。
              </p>
            </div>

            <div className="space-y-2">
              <Label>API Key {apiKeyConfigured ? "" : "*"}</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="password"
                  placeholder={apiKeyConfigured ? "已配置，留空保持不变" : "输入 API Key"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  required={!apiKeyConfigured}
                />
                {apiKeyConfigured && (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>模型名称 *</Label>
              <Input
                placeholder="gpt-4o / deepseek-chat / qwen-vl-plus"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                图片识别功能需要选择支持视觉能力的模型（如 gpt-4o、qwen-vl-plus 等）。
              </p>
            </div>

            <div className="flex gap-3">
              <Button type="submit" size="sm" disabled={saving}>
                {saving ? "保存中..." : "保存配置"}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={handleTest} disabled={testing}>
                {testing ? "测试中..." : "测试连接"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {apiKeyConfigured && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">AI 功能说明</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
              <div>
                <p className="font-medium">拍照识别录入</p>
                <p className="text-muted-foreground">上传错题图片，AI 自动识别题目内容并填充表单。</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
              <div>
                <p className="font-medium">错题 AI 分析</p>
                <p className="text-muted-foreground">在错题详情页点击“AI 分析”，获取错误原因、知识点讲解、变式练习。</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
              <div>
                <p className="font-medium">错题总结归纳</p>
                <p className="text-muted-foreground">在统计看板点击“AI 总结”，获取薄弱点归类、学习规划和复习建议。</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </DashboardPage>
  );
}
