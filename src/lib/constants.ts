export const SUBJECTS = {
  CHINESE: { label: "语文", color: "bg-rose-100 text-rose-800 border-rose-200" },
  MATH: { label: "数学", color: "bg-indigo-100 text-indigo-800 border-indigo-200" },
  ENGLISH: { label: "英语", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
} as const;

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
