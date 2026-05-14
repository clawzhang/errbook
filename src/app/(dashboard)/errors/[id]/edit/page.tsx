"use client";

import { useEffect, useState } from "react";
import { ErrorForm } from "@/components/errors/error-form";
import { use } from "react";

export default function EditErrorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [defaultValues, setDefaultValues] = useState<null | {
    subject: string;
    knowledgePointId: string | null;
    question: string;
    questionImages: string[];
    wrongAnswer: string;
    correctAnswer: string;
    analysis: string | null;
    errorReason: string | null;
    source: string;
    sourceDetail: string | null;
  }>(null);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/errors/${id}`);
      const data = await res.json();
      if (res.ok) {
        setDefaultValues({
          subject: data.error.subject,
          knowledgePointId: data.error.knowledgePointId,
          question: data.error.question,
          questionImages: JSON.parse(data.error.questionImages || "[]"),
          wrongAnswer: data.error.wrongAnswer,
          correctAnswer: data.error.correctAnswer,
          analysis: data.error.analysis,
          errorReason: data.error.errorReason,
          source: data.error.source,
          sourceDetail: data.error.sourceDetail,
        });
      }
    }
    load();
  }, [id]);

  if (!defaultValues) {
    return <div className="text-center py-12 text-muted-foreground">加载中...</div>;
  }

  return <ErrorForm mode="edit" errorId={id} defaultValues={defaultValues} />;
}
