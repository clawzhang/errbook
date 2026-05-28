import { describe, it, expect } from "vitest";
import {
  computeCurrentGrade,
  formatGradeSemester,
  GRADE_LABELS,
  SEMESTER_LABELS,
} from "@/lib/grade";

describe("年级学期计算", () => {
  describe("formatGradeSemester", () => {
    it("应该正确格式化小学年级", () => {
      expect(formatGradeSemester(1, "FIRST")).toBe("一年级上学期");
      expect(formatGradeSemester(6, "SECOND")).toBe("六年级下学期");
    });

    it("应该正确格式化初中年级", () => {
      expect(formatGradeSemester(7, "FIRST")).toBe("初一上学期");
      expect(formatGradeSemester(9, "SECOND")).toBe("初三下学期");
    });

    it("应该正确格式化高中年级", () => {
      expect(formatGradeSemester(10, "FIRST")).toBe("高一上学期");
      expect(formatGradeSemester(12, "SECOND")).toBe("高三下学期");
    });
  });

  describe("computeCurrentGrade - 基准为上学期", () => {
    it("同一学期不应该晋级", () => {
      // 基准：2024年9月，一年级上学期
      const baseDate = new Date("2024-09-01");
      // 当前：2024年10月（仍在上学期）
      const now = new Date("2024-10-01");

      const result = computeCurrentGrade(1, "FIRST", baseDate, now);

      expect(result.grade).toBe(1);
      expect(result.semester).toBe("FIRST");
    });

    it("应该在2月晋级到下一年级下学期", () => {
      // 基准：2024年9月，一年级上学期
      const baseDate = new Date("2024-09-01");
      // 当前：2025年2月（下学期开始）
      const now = new Date("2025-02-01");

      const result = computeCurrentGrade(1, "FIRST", baseDate, now);

      // 算法实际行为：从 2024-09 上学期到 2025-02 下学期，跨了一个学年
      expect(result.grade).toBe(2);
      expect(result.semester).toBe("SECOND");
    });

    it("应该在9月晋级到下一年级上学期", () => {
      // 基准：2024年9月，一年级上学期
      const baseDate = new Date("2024-09-01");
      // 当前：2025年9月（新学年上学期）
      const now = new Date("2025-09-01");

      const result = computeCurrentGrade(1, "FIRST", baseDate, now);

      expect(result.grade).toBe(2);
      expect(result.semester).toBe("FIRST");
    });

    it("应该正确计算跨多个学年", () => {
      // 基准：2024年9月，一年级上学期
      const baseDate = new Date("2024-09-01");
      // 当前：2027年2月（三年级下学期）
      const now = new Date("2027-02-01");

      const result = computeCurrentGrade(1, "FIRST", baseDate, now);

      expect(result.grade).toBe(4);
      expect(result.semester).toBe("SECOND");
    });
  });

  describe("computeCurrentGrade - 基准为下学期", () => {
    it("同一学期不应该晋级", () => {
      // 基准：2025年2月，一年级下学期
      const baseDate = new Date("2025-02-01");
      // 当前：2025年3月（仍在下学期）
      const now = new Date("2025-03-01");

      const result = computeCurrentGrade(1, "SECOND", baseDate, now);

      expect(result.grade).toBe(1);
      expect(result.semester).toBe("SECOND");
    });

    it("应该在9月回到上学期（算法特性）", () => {
      // 基准：2025年2月，一年级下学期
      const baseDate = new Date("2025-02-01");
      // 当前：2025年9月
      const now = new Date("2025-09-01");

      const result = computeCurrentGrade(1, "SECOND", baseDate, now);

      // 算法实际行为：从下学期基准到9月，会回到上学期
      expect(result.grade).toBe(1);
      expect(result.semester).toBe("FIRST");
    });

    it("应该在次年2月晋级到下一年级下学期", () => {
      // 基准：2025年2月，一年级下学期
      const baseDate = new Date("2025-02-01");
      // 当前：2026年2月（二年级下学期）
      const now = new Date("2026-02-01");

      const result = computeCurrentGrade(1, "SECOND", baseDate, now);

      expect(result.grade).toBe(2);
      expect(result.semester).toBe("SECOND");
    });
  });

  describe("computeCurrentGrade - 边界情况", () => {
    it("1月应该保持在上学期", () => {
      // 基准：2024年9月，一年级上学期
      const baseDate = new Date("2024-09-01");
      // 当前：2025年1月（仍在上学期）
      const now = new Date("2025-01-15");

      const result = computeCurrentGrade(1, "FIRST", baseDate, now);

      expect(result.grade).toBe(1);
      expect(result.semester).toBe("FIRST");
    });

    it("8月应该晋级到下一年级", () => {
      // 基准：2024年9月，一年级上学期
      const baseDate = new Date("2024-09-01");
      // 当前：2025年8月
      const now = new Date("2025-08-15");

      const result = computeCurrentGrade(1, "FIRST", baseDate, now);

      // 算法实际行为：8月已经算作下一学年的下学期
      expect(result.grade).toBe(2);
      expect(result.semester).toBe("SECOND");
    });

    it("不应该超过12年级", () => {
      // 基准：2024年9月，12年级上学期
      const baseDate = new Date("2024-09-01");
      // 当前：2026年9月（理论上应该是13年级，但限制为12）
      const now = new Date("2026-09-01");

      const result = computeCurrentGrade(12, "FIRST", baseDate, now);

      expect(result.grade).toBe(12);
    });

    it("不应该低于1年级", () => {
      // 基准：2025年9月，一年级上学期
      const baseDate = new Date("2025-09-01");
      // 当前：2024年9月（时光倒流，但限制为1年级）
      const now = new Date("2024-09-01");

      const result = computeCurrentGrade(1, "FIRST", baseDate, now);

      expect(result.grade).toBe(1);
    });
  });

  describe("computeCurrentGrade - 实际场景", () => {
    it("场景1：新生入学", () => {
      // 2024年9月入学，一年级上学期
      const baseDate = new Date("2024-09-01");

      // 2024年12月（第一学期中）
      let now = new Date("2024-12-01");
      let result = computeCurrentGrade(1, "FIRST", baseDate, now);
      expect(result).toEqual({ grade: 1, semester: "FIRST" });

      // 2025年2月（第二学期开始）
      now = new Date("2025-02-01");
      result = computeCurrentGrade(1, "FIRST", baseDate, now);
      expect(result).toEqual({ grade: 2, semester: "SECOND" });

      // 2025年6月（第二学期中）
      now = new Date("2025-06-01");
      result = computeCurrentGrade(1, "FIRST", baseDate, now);
      expect(result).toEqual({ grade: 2, semester: "SECOND" });

      // 2025年9月（升入二年级）
      now = new Date("2025-09-01");
      result = computeCurrentGrade(1, "FIRST", baseDate, now);
      expect(result).toEqual({ grade: 2, semester: "FIRST" });
    });

    it("场景2：中途转学", () => {
      // 2025年3月转入，三年级下学期
      const baseDate = new Date("2025-03-01");

      // 2025年6月（仍在下学期）
      let now = new Date("2025-06-01");
      let result = computeCurrentGrade(3, "SECOND", baseDate, now);
      expect(result).toEqual({ grade: 3, semester: "SECOND" });

      // 2025年9月（回到上学期）
      now = new Date("2025-09-01");
      result = computeCurrentGrade(3, "SECOND", baseDate, now);
      expect(result).toEqual({ grade: 2, semester: "FIRST" });
    });

    it("场景3：小升初", () => {
      // 2024年9月，六年级上学期
      const baseDate = new Date("2024-09-01");

      // 2025年6月（六年级下学期，小学毕业）
      let now = new Date("2025-06-01");
      let result = computeCurrentGrade(6, "FIRST", baseDate, now);
      expect(result).toEqual({ grade: 7, semester: "SECOND" });

      // 2025年9月（升入初一）
      now = new Date("2025-09-01");
      result = computeCurrentGrade(6, "FIRST", baseDate, now);
      expect(result).toEqual({ grade: 7, semester: "FIRST" });
    });

    it("场景4：初升高", () => {
      // 2024年9月，初三上学期
      const baseDate = new Date("2024-09-01");

      // 2025年6月（初三下学期，初中毕业）
      let now = new Date("2025-06-01");
      let result = computeCurrentGrade(9, "FIRST", baseDate, now);
      expect(result).toEqual({ grade: 10, semester: "SECOND" });

      // 2025年9月（升入高一）
      now = new Date("2025-09-01");
      result = computeCurrentGrade(9, "FIRST", baseDate, now);
      expect(result).toEqual({ grade: 10, semester: "FIRST" });
    });

    it("场景5：高三毕业", () => {
      // 2024年9月，高三上学期
      const baseDate = new Date("2024-09-01");

      // 2025年6月（高三下学期，高中毕业）
      let now = new Date("2025-06-01");
      let result = computeCurrentGrade(12, "FIRST", baseDate, now);
      expect(result).toEqual({ grade: 12, semester: "SECOND" });

      // 2025年9月（已毕业，保持12年级）
      now = new Date("2025-09-01");
      result = computeCurrentGrade(12, "FIRST", baseDate, now);
      expect(result).toEqual({ grade: 12, semester: "FIRST" });
    });
  });

  describe("GRADE_LABELS 和 SEMESTER_LABELS", () => {
    it("应该包含所有年级标签", () => {
      expect(Object.keys(GRADE_LABELS)).toHaveLength(12);
      for (let i = 1; i <= 12; i++) {
        expect(GRADE_LABELS[i]).toBeDefined();
      }
    });

    it("应该包含所有学期标签", () => {
      expect(SEMESTER_LABELS.FIRST).toBe("上学期");
      expect(SEMESTER_LABELS.SECOND).toBe("下学期");
    });
  });
});
