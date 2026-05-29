"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  SUBJECTS,
  ERROR_SOURCES,
  getQuestionTypesBySubject,
  isQuestionTypeValid,
} from "@/lib/constants";
import { ImageUploader } from "@/components/errors/image-uploader";
import { toast } from "sonner";
import { ArrowLeft, Sparkles } from "lucide-react";
import { DashboardHero, DashboardPage } from "@/components/layout/dashboard-shell";
import { ImageLightboxGallery } from "@/components/common/image-lightbox-gallery";
import { KnowledgePointSelector } from "@/components/knowledge/knowledge-point-selector";

interface ErrorFormProps {
  mode: "create" | "edit";
  errorId?: string;
  defaultValues?: {
    subject?: string;
    questionType?: string | null;
    knowledgePointId?: string | null;
    question?: string;
    questionImages?: string[];
    wrongAnswer?: string;
    correctAnswer?: string;
    analysis?: string | null;
    errorReason?: string | null;
    source?: string;
    sourceDetail?: string | null;
  };
}

interface OCRResult {
  question: string;
  wrongAnswer: string;
  correctAnswer: string;
  analysis: string;
  subject: string;
  questionType?: string;
  knowledgePoint: string;
  errorReason: string;
}

export function ErrorForm({ mode, errorId, defaultValues }: ErrorFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [subject, setSubject] = useState(defaultValues?.subject || "");
  const [questionType, setQuestionType] = useState(defaultValues?.questionType || "");
  const [knowledgePointId, setKnowledgePointId] = useState(
    defaultValues?.knowledgePointId || ""
  );
  const [question, setQuestion] = useState(defaultValues?.question || "");
  const [wrongAnswer, setWrongAnswer] = useState(defaultValues?.wrongAnswer || "");
  const [correctAnswer, setCorrectAnswer] = useState(defaultValues?.correctAnswer || "");
  const [analysis, setAnalysis] = useState(defaultValues?.analysis || "");
  const [errorReason, setErrorReason] = useState(defaultValues?.errorReason || "");
  const [source, setSource] = useState(defaultValues?.source || "HOMEWORK");
  const [sourceDetail, setSourceDetail] = useState(defaultValues?.sourceDetail || "");
  const [pendingKnowledgePointName, setPendingKnowledgePointName] = useState("");
  const [questionImages, setQuestionImages] = useState(
    defaultValues?.questionImages || []
  );

  const questionTypeOptions = getQuestionTypesBySubject(subject);

  function applySubjectChange(nextSubject: string) {
    setSubject(nextSubject);
    setKnowledgePointId("");
    setPendingKnowledgePointName("");
    if (!isQuestionTypeValid(nextSubject, questionType)) {
      setQuestionType("");
    }
  }

  function handleOCRResult(result: OCRResult) {
    if (result.question) setQuestion(result.question);
    if (result.wrongAnswer) setWrongAnswer(result.wrongAnswer);
    if (result.correctAnswer) setCorrectAnswer(result.correctAnswer);
    if (result.analysis) setAnalysis(result.analysis);
    if (result.errorReason) setErrorReason(result.errorReason);
    if (result.subject && ["CHINESE", "MATH", "ENGLISH"].includes(result.subject)) {
      applySubjectChange(result.subject);
      if (result.questionType && isQuestionTypeValid(result.subject, result.questionType)) {
        setQuestionType(result.questionType);
      }
    } else if (result.questionType && isQuestionTypeValid(subject, result.questionType)) {
      setQuestionType(result.questionType);
    }
    if (result.knowledgePoint) setPendingKnowledgePointName(result.knowledgePoint);
  }

  function handleSubjectChange(value: string | null) {
    applySubjectChange(value || "");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const url = mode === "create" ? "/api/errors" : `/api/errors/${errorId}`;
      const method = mode === "create" ? "POST" : "PUT";

      const body: Record<string, unknown> = {
        subject,
        questionType: questionType || null,
        knowledgePointId: knowledgePointId || null,
        knowledgePointName: pendingKnowledgePointName || null,
        question,
        questionImages,
        wrongAnswer,
        correctAnswer,
        analysis: analysis || null,
        errorReason: errorReason || null,
        source,
        sourceDetail: sourceDetail || null,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "操作失败");
        return;
      }

      toast.success(mode === "create" ? "错题已添加" : "错题已更新");
      router.push(`/errors/${data.error.id}`);
      router.refresh();
    } catch {
      toast.error("操作失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardPage>
      <DashboardHero
        eyebrow={mode === "create" ? "新增错题" : "编辑错题"}
        title={mode === "create" ? "把新错题收进系统" : "更新这条错题"}
        description={
          mode === "create"
            ? "录入题目、错误答案、题目类型和知识点，让后续复习调度和统计分析真正可用。"
            : "你可以修正题目内容、题目类型、来源、知识点和解析，使这条记录更准确。"
        }
        actions={
          <Button variant="outline" type="button" onClick={() => router.back()}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            返回上一页
          </Button>
        }
      />

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>{mode === "create" ? "错题内容" : "错题编辑"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {mode === "create" && (
              <>
                <div className="rounded-[1.5rem] border border-white/80 bg-slate-50/72 p-4">
                  <Label className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <Sparkles className="h-4 w-4 text-primary" />
                    拍照识别（AI 自动填充）
                  </Label>
                  <ImageUploader
                    images={questionImages}
                    onImagesChange={setQuestionImages}
                    onOCRResult={handleOCRResult}
                  />
                </div>
                <Separator />
              </>
            )}

            {mode === "edit" && questionImages.length > 0 && (
              <>
                <div className="rounded-[1.5rem] border border-white/80 bg-slate-50/72 p-4">
                  <Label className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                    原始题图
                  </Label>
                  <ImageLightboxGallery
                    images={questionImages}
                    altPrefix="原始题图"
                    imageClassName="h-20 w-auto"
                  />
                </div>
                <Separator />
              </>
            )}

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label>科目 *</Label>
                <Select value={subject} onValueChange={handleSubjectChange}>
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
                <Label>题目类型</Label>
                <Select
                  value={questionType}
                  onValueChange={(value) => setQuestionType(value || "")}
                  disabled={!questionTypeOptions}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={subject ? "选择题目类型" : "请先选择科目"}>
                      {questionType && questionTypeOptions
                        ? questionTypeOptions[
                            questionType as keyof typeof questionTypeOptions
                          ]?.label
                        : null}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {questionTypeOptions
                      ? Object.entries(questionTypeOptions).map(([key, { label }]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))
                      : null}
                  </SelectContent>
                </Select>
              </div>

              <KnowledgePointSelector
                subject={subject}
                value={knowledgePointId}
                onChange={setKnowledgePointId}
                pendingKnowledgePointName={pendingKnowledgePointName}
                onPendingKnowledgePointHandled={() => setPendingKnowledgePointName("")}
              />

              <div className="space-y-2">
                <Label>来源 *</Label>
                <Select value={source} onValueChange={(v) => setSource(v || "HOMEWORK")}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择来源">
                      {source ? ERROR_SOURCES[source as keyof typeof ERROR_SOURCES]?.label : null}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ERROR_SOURCES).map(([key, { label }]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>来源详情</Label>
                <Input
                  placeholder="如：期中考试第5题"
                  value={sourceDetail}
                  onChange={(e) => setSourceDetail(e.target.value)}
                />
                {mode === "create" && defaultValues?.sourceDetail ? (
                  <p className="text-xs text-muted-foreground">
                    已自动带入上一条错题的来源信息，可按当前题目修改。
                  </p>
                ) : null}
              </div>
            </div>

            <div className="space-y-2">
              <Label>题目内容 *</Label>
              <Textarea
                placeholder="输入题目内容，数学公式使用 $...$ 或 $$...$$ 包裹"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                rows={4}
                required
              />
              <p className="text-xs text-muted-foreground">
                支持 LaTeX 公式：行内用 $公式$，独立行用 $$公式$$
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>错误答案</Label>
                <Textarea
                  placeholder="可留空，适合试卷未填写或还未订正的情况"
                  value={wrongAnswer}
                  onChange={(e) => setWrongAnswer(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>正确答案</Label>
                <Textarea
                  placeholder="可留空，后续订正后再补充"
                  value={correctAnswer}
                  onChange={(e) => setCorrectAnswer(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>错误原因</Label>
              <Textarea
                placeholder="分析为什么会做错"
                value={errorReason}
                onChange={(e) => setErrorReason(e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>解题思路/解析</Label>
              <Textarea
                placeholder="正确的解题思路和步骤"
                value={analysis}
                onChange={(e) => setAnalysis(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <Button type="submit" disabled={loading}>
                {loading ? "保存中..." : mode === "create" ? "保存这条错题" : "保存修改"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                取消
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </DashboardPage>
  );
}
