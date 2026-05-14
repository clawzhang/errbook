"use client";

import { SUBJECTS, MASTERY_LEVELS, ERROR_SOURCES } from "@/lib/constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface ErrorFiltersProps {
  subject: string;
  masteryLevel: string;
  source: string;
  needReview: boolean;
  onSubjectChange: (value: string | null) => void;
  onMasteryLevelChange: (value: string | null) => void;
  onSourceChange: (value: string | null) => void;
  onNeedReviewChange: (value: boolean) => void;
  onClear: () => void;
}

const subjectLabels: Record<string, string> = Object.fromEntries(
  Object.entries(SUBJECTS).map(([k, v]) => [k, v.label])
);
const masteryLabels: Record<string, string> = Object.fromEntries(
  Object.entries(MASTERY_LEVELS).map(([k, v]) => [k, v.label])
);
const sourceLabels: Record<string, string> = Object.fromEntries(
  Object.entries(ERROR_SOURCES).map(([k, v]) => [k, v.label])
);

export function ErrorFilters({
  subject,
  masteryLevel,
  source,
  needReview,
  onSubjectChange,
  onMasteryLevelChange,
  onSourceChange,
  onNeedReviewChange,
  onClear,
}: ErrorFiltersProps) {
  const hasFilters = subject || masteryLevel || source || needReview;

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <Select value={subject} onValueChange={onSubjectChange}>
        <SelectTrigger className="h-9 w-[112px]">
          <SelectValue placeholder="全部科目">
            {subject ? subjectLabels[subject] : null}
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

      <Select value={masteryLevel} onValueChange={onMasteryLevelChange}>
        <SelectTrigger className="h-9 w-[124px]">
          <SelectValue placeholder="全部掌握度">
            {masteryLevel ? masteryLabels[masteryLevel] : null}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {Object.entries(MASTERY_LEVELS).map(([key, { label }]) => (
            <SelectItem key={key} value={key}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={source} onValueChange={onSourceChange}>
        <SelectTrigger className="h-9 w-[112px]">
          <SelectValue placeholder="全部来源">
            {source ? sourceLabels[source] : null}
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

      <Button
        variant={needReview ? "default" : "outline"}
        size="sm"
        onClick={() => onNeedReviewChange(!needReview)}
      >
        待复习
      </Button>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={onClear}>
          <X className="h-3 w-3 mr-1" />
          清除筛选
        </Button>
      )}
    </div>
  );
}
