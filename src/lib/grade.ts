// 年级学期计算逻辑

export type Semester = "FIRST" | "SECOND";

export interface GradeInfo {
  grade: number;      // 1-12
  semester: Semester;
}

// 中文标签
export const GRADE_LABELS: Record<number, string> = {
  1: "一年级",
  2: "二年级",
  3: "三年级",
  4: "四年级",
  5: "五年级",
  6: "六年级",
  7: "初一",
  8: "初二",
  9: "初三",
  10: "高一",
  11: "高二",
  12: "高三",
};

export const SEMESTER_LABELS: Record<Semester, string> = {
  FIRST: "上学期",
  SECOND: "下学期",
};

/**
 * 格式化年级学期为中文显示
 */
export function formatGradeSemester(grade: number, semester: string): string {
  return `${GRADE_LABELS[grade] || `${grade}年级`}${SEMESTER_LABELS[semester as Semester] || semester}`;
}

/**
 * 根据用户设置的基准年级学期和基准日期，计算当前应该所在的年级学期
 *
 * 规则：
 * - 9月开学 → 新学年上学期（年级+1，上学期）
 * - 2月开学 → 新学年下学期（年级不变，下学期）
 * - 具体以当月1日为切换点
 *
 * @param baseGrade 基准年级
 * @param baseSemester 基准学期
 * @param baseDate 基准日期（gradeSetAt）
 * @param now 当前日期（默认 new Date()）
 */
export function computeCurrentGrade(
  baseGrade: number,
  baseSemester: Semester,
  baseDate: Date,
  now: Date = new Date()
): GradeInfo {
  // 以每个学年的上学期（9月）为锚点，统一计算绝对学期序号，
  // 避免“当前是下学期但基准也在同一下学期”时出现倒退一级的问题。
  const baseYear = baseDate.getFullYear();
  const baseMonth = baseDate.getMonth() + 1; // 1-12

  const nowYear = now.getFullYear();
  const nowMonth = now.getMonth() + 1;

  const baseAcademicYear =
    baseSemester === "FIRST"
      ? baseMonth >= 9
        ? baseYear
        : baseYear - 1
      : baseMonth >= 9
        ? baseYear - 1
        : baseYear;
  const baseAbsoluteSemester =
    baseAcademicYear * 2 + (baseSemester === "FIRST" ? 0 : 1);

  let currentAcademicYear: number;
  let currentSemesterInYear: 0 | 1;

  if (nowMonth >= 9) {
    currentAcademicYear = nowYear;
    currentSemesterInYear = 0;
  } else if (nowMonth >= 2) {
    currentAcademicYear = nowYear;
    currentSemesterInYear = 1;
  } else {
    currentAcademicYear = nowYear - 1;
    currentSemesterInYear = 0;
  }

  const currentAbsoluteSemester =
    currentAcademicYear * 2 + currentSemesterInYear;

  // 学期差 = 当前绝对学期 - 基准绝对学期
  const semesterDiff = currentAbsoluteSemester - baseAbsoluteSemester;

  // 年级变化：每2个学期升1个年级
  const gradeDiff = Math.floor(semesterDiff / 2);
  const semesterOffset = ((semesterDiff % 2) + 2) % 2; // 确保非负

  // 基准：baseGrade 在 baseSemester
  // 经过 semesterDiff 个学期后的年级
  const newGrade = Math.min(12, Math.max(1, baseGrade + gradeDiff));
  const newSemester: Semester = semesterOffset === 0 ? baseSemester : (baseSemester === "FIRST" ? "SECOND" : "FIRST");

  return { grade: newGrade, semester: newSemester };
}

/**
 * 获取所有年级选项
 */
export function getGradeOptions() {
  return Array.from({ length: 12 }, (_, i) => ({
    value: (i + 1).toString(),
    label: GRADE_LABELS[i + 1],
  }));
}

/**
 * 获取学期选项
 */
export function getSemesterOptions() {
  return [
    { value: "FIRST", label: "上学期" },
    { value: "SECOND", label: "下学期" },
  ];
}
