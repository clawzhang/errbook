"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SubjectTag } from "@/components/common/subject-tag";
import { MasteryBadge } from "@/components/common/mastery-badge";
import { QuestionContent } from "@/components/common/question-content";
import { ERROR_SOURCES, getQuestionTypeLabel } from "@/lib/constants";
import { formatGradeSemester } from "@/lib/grade";
import { format } from "date-fns";

interface ErrorCardProps {
  error: {
    id: string;
    subject: string;
    question: string;
    masteryLevel: string;
    source: string;
    sourceDetail?: string | null;
    questionType?: string | null;
    nextReviewDate: string;
    createdAt: string;
    grade: number;
    semester: string;
    knowledgePoint?: { id: string; name: string } | null;
  };
  detailHref?: string;
}

export function ErrorCard({ error, detailHref }: ErrorCardProps) {
  const truncatedQuestion =
    error.question.length > 120
      ? error.question.slice(0, 120) + "..."
      : error.question;

  const isOverdue = new Date(error.nextReviewDate) <= new Date();
  const questionTypeLabel = getQuestionTypeLabel(error.subject, error.questionType);

  return (
    <Link href={detailHref || `/errors/${error.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <SubjectTag subject={error.subject as "CHINESE" | "MATH" | "ENGLISH"} />
              {questionTypeLabel ? (
                <Badge variant="secondary" className="text-xs">
                  {questionTypeLabel}
                </Badge>
              ) : null}
              {error.knowledgePoint && (
                <Badge variant="outline" className="text-xs">
                  {error.knowledgePoint.name}
                </Badge>
              )}
            </div>
            <MasteryBadge level={error.masteryLevel as "NOT_MASTERED" | "PARTIALLY_MASTERED" | "MASTERED"} />
          </div>

          <QuestionContent
            content={truncatedQuestion}
            className="text-sm line-clamp-3"
          />

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {formatGradeSemester(error.grade, error.semester)}
              {" · "}
              {ERROR_SOURCES[error.source as keyof typeof ERROR_SOURCES]?.label}
              {error.sourceDetail && ` · ${error.sourceDetail}`}
            </span>
            <div className="flex items-center gap-2">
              {isOverdue && (
                <Badge variant="destructive" className="text-xs">
                  待复习
                </Badge>
              )}
              <span>{format(new Date(error.createdAt), "MM/dd")}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
