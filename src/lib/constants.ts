export const SUBJECTS = {
  CHINESE: { label: "语文", color: "bg-rose-100 text-rose-800 border-rose-200" },
  MATH: { label: "数学", color: "bg-indigo-100 text-indigo-800 border-indigo-200" },
  ENGLISH: { label: "英语", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
} as const;

export const QUESTION_TYPES = {
  CHINESE: {
    CHOICE: { label: "选择题" },
    JUDGMENT: { label: "判断题" },
    FILL_BLANK: { label: "填空题" },
    READING: { label: "阅读理解" },
    COMPOSITION: { label: "作文题" },
    OTHER: { label: "其他" },
  },
  MATH: {
    CHOICE: { label: "选择题" },
    JUDGMENT: { label: "判断题" },
    FILL_BLANK: { label: "填空题" },
    APPLICATION: { label: "应用题" },
    CALCULATION: { label: "计算题" },
    OTHER: { label: "其他" },
  },
  ENGLISH: {
    CHOICE: { label: "选择题" },
    JUDGMENT: { label: "判断题" },
    FILL_BLANK: { label: "填空题" },
    READING: { label: "阅读理解" },
    WRITING: { label: "写作题" },
    OTHER: { label: "其他" },
  },
} as const;

export type SubjectKey = keyof typeof SUBJECTS;
export type QuestionTypeMap = typeof QUESTION_TYPES;
export type QuestionTypeKey = keyof QuestionTypeMap[keyof QuestionTypeMap];

export function getQuestionTypesBySubject(subject: string) {
  if (subject in QUESTION_TYPES) {
    return QUESTION_TYPES[subject as SubjectKey];
  }
  return null;
}

export function isQuestionTypeValid(subject: string, questionType: string) {
  const questionTypes = getQuestionTypesBySubject(subject);
  return !!questionTypes && questionType in questionTypes;
}

export function getQuestionTypeLabel(
  subject: string,
  questionType?: string | null
) {
  if (!questionType) return null;
  const questionTypes = getQuestionTypesBySubject(subject);
  if (!questionTypes) return null;
  return questionTypes[questionType as keyof typeof questionTypes]?.label ?? null;
}

export const MASTERY_LEVELS = {
  NOT_MASTERED: { label: "未掌握", color: "bg-red-100 text-red-700 border-red-200" },
  PARTIALLY_MASTERED: { label: "部分掌握", color: "bg-amber-100 text-amber-700 border-amber-200" },
  MASTERED: { label: "已掌握", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
} as const;

export const ERROR_SOURCES = {
  EXAM: { label: "试卷" },
  HOMEWORK: { label: "作业" },
  CLASS: { label: "课堂" },
  OTHER: { label: "其他" },
} as const;

export const REVIEW_QUALITIES = {
  AGAIN: { label: "完全不会", color: "bg-red-500", intervalNote: "1天后复习" },
  HARD: { label: "困难", color: "bg-amber-500", intervalNote: "缩短间隔" },
  GOOD: { label: "良好", color: "bg-blue-500", intervalNote: "正常推进" },
  EASY: { label: "轻松", color: "bg-emerald-500", intervalNote: "加长间隔" },
} as const;
