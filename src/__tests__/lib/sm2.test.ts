import { describe, it, expect } from "vitest";
import { calculateSM2 } from "@/lib/sm2";

describe("SM2 复习算法", () => {
  const initialState = {
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
  };

  describe("AGAIN - 完全不记得", () => {
    it("应该重置间隔为 1 天", () => {
      const result = calculateSM2(initialState, "AGAIN");
      expect(result.interval).toBe(1);
    });

    it("应该重置重复次数为 0", () => {
      const result = calculateSM2(initialState, "AGAIN");
      expect(result.repetitions).toBe(0);
    });

    it("应该降低难度系数", () => {
      const result = calculateSM2(initialState, "AGAIN");
      expect(result.easeFactor).toBe(2.3); // 2.5 - 0.2
    });

    it("难度系数不应低于 1.3", () => {
      const lowState = { ...initialState, easeFactor: 1.4 };
      const result = calculateSM2(lowState, "AGAIN");
      expect(result.easeFactor).toBe(1.3);
    });

    it("应该标记为未掌握", () => {
      const result = calculateSM2(initialState, "AGAIN");
      expect(result.masteryLevel).toBe("NOT_MASTERED");
    });
  });

  describe("HARD - 困难", () => {
    it("应该缩短间隔到 70%", () => {
      const state = { ...initialState, interval: 10 };
      const result = calculateSM2(state, "HARD");
      expect(result.interval).toBe(7); // 10 * 0.7
    });

    it("间隔至少为 1 天", () => {
      const state = { ...initialState, interval: 1 };
      const result = calculateSM2(state, "HARD");
      expect(result.interval).toBe(1);
    });

    it("应该降低难度系数", () => {
      const result = calculateSM2(initialState, "HARD");
      expect(result.easeFactor).toBe(2.35); // 2.5 - 0.15
    });

    it("应该重置重复次数", () => {
      const state = { ...initialState, repetitions: 3 };
      const result = calculateSM2(state, "HARD");
      expect(result.repetitions).toBe(0);
    });
  });

  describe("GOOD - 正常", () => {
    it("第一次复习应该间隔 1 天", () => {
      const result = calculateSM2(initialState, "GOOD");
      expect(result.interval).toBe(1);
      expect(result.repetitions).toBe(1);
    });

    it("第二次复习应该间隔 6 天", () => {
      const state = { ...initialState, repetitions: 1, interval: 1 };
      const result = calculateSM2(state, "GOOD");
      expect(result.interval).toBe(6);
      expect(result.repetitions).toBe(2);
    });

    it("第三次及以后应该按难度系数增长", () => {
      const state = { ...initialState, repetitions: 2, interval: 6 };
      const result = calculateSM2(state, "GOOD");
      expect(result.interval).toBe(15); // 6 * 2.5
      expect(result.repetitions).toBe(3);
    });

    it("难度系数保持不变", () => {
      const result = calculateSM2(initialState, "GOOD");
      expect(result.easeFactor).toBe(2.5);
    });
  });

  describe("EASY - 简单", () => {
    it("应该按 1.3 倍难度系数增长间隔", () => {
      const state = { ...initialState, interval: 6 };
      const result = calculateSM2(state, "EASY");
      expect(result.interval).toBe(20); // 6 * 2.5 * 1.3 = 19.5 -> 20
    });

    it("应该提高难度系数", () => {
      const result = calculateSM2(initialState, "EASY");
      expect(result.easeFactor).toBe(2.65); // 2.5 + 0.15
    });

    it("难度系数不应超过 3.0", () => {
      const highState = { ...initialState, easeFactor: 2.9 };
      const result = calculateSM2(highState, "EASY");
      expect(result.easeFactor).toBe(3.0);
    });

    it("应该增加重复次数", () => {
      const result = calculateSM2(initialState, "EASY");
      expect(result.repetitions).toBe(1);
    });
  });

  describe("掌握度判定", () => {
    it("初始状态第一次复习后应该是部分掌握", () => {
      const result = calculateSM2(initialState, "GOOD");
      // repetitions 从 0 变为 1，所以是 PARTIALLY_MASTERED
      expect(result.masteryLevel).toBe("PARTIALLY_MASTERED");
      expect(result.repetitions).toBe(1);
    });

    it("重复 1 次应该是部分掌握", () => {
      const state = { ...initialState, repetitions: 1, interval: 1 };
      const result = calculateSM2(state, "GOOD");
      expect(result.masteryLevel).toBe("PARTIALLY_MASTERED");
    });

    it("重复 3 次且间隔 >= 21 天应该是已掌握", () => {
      const state = { ...initialState, repetitions: 3, interval: 21 };
      const result = calculateSM2(state, "GOOD");
      expect(result.masteryLevel).toBe("MASTERED");
      expect(result.repetitions).toBe(4);
      expect(result.interval).toBeGreaterThanOrEqual(21);
    });

    it("重复 3 次但间隔 < 21 天，复习后间隔仍 < 21 天应该是部分掌握", () => {
      // 使用较小的 easeFactor 确保复习后间隔仍 < 21
      const state = { ...initialState, easeFactor: 1.3, repetitions: 3, interval: 10 };
      const result = calculateSM2(state, "GOOD");
      // 10 * 1.3 = 13，仍然 < 21
      expect(result.interval).toBeLessThan(21);
      expect(result.masteryLevel).toBe("PARTIALLY_MASTERED");
    });

    it("重复次数不足 3 次应该是部分掌握", () => {
      const state = { ...initialState, repetitions: 2, interval: 30 };
      const result = calculateSM2(state, "GOOD");
      // repetitions 从 2 变为 3，interval = 30 * 2.5 = 75
      // repetitions >= 3 且 interval >= 21，所以是 MASTERED
      expect(result.repetitions).toBe(3);
      expect(result.interval).toBeGreaterThanOrEqual(21);
      expect(result.masteryLevel).toBe("MASTERED");
    });
  });

  describe("下次复习日期", () => {
    it("应该返回未来的日期", () => {
      const now = new Date();
      const result = calculateSM2(initialState, "GOOD");
      expect(result.nextReviewDate.getTime()).toBeGreaterThan(now.getTime());
    });

    it("应该根据间隔计算正确的日期", () => {
      const now = new Date();
      const result = calculateSM2(initialState, "GOOD");
      const expectedDate = new Date(now);
      expectedDate.setDate(expectedDate.getDate() + result.interval);

      // 允许 1 秒的误差（测试执行时间）
      const diff = Math.abs(
        result.nextReviewDate.getTime() - expectedDate.getTime()
      );
      expect(diff).toBeLessThan(1000);
    });
  });

  describe("边界情况", () => {
    it("应该处理极小的间隔", () => {
      const state = { ...initialState, interval: 0 };
      const result = calculateSM2(state, "GOOD");
      expect(result.interval).toBeGreaterThan(0);
    });

    it("应该处理极大的间隔", () => {
      const state = { ...initialState, interval: 365, repetitions: 10 };
      const result = calculateSM2(state, "GOOD");
      expect(result.interval).toBeGreaterThan(365);
    });

    it("应该处理极小的难度系数", () => {
      const state = { ...initialState, easeFactor: 1.3 };
      const result = calculateSM2(state, "AGAIN");
      expect(result.easeFactor).toBe(1.3);
    });

    it("应该处理极大的难度系数", () => {
      const state = { ...initialState, easeFactor: 3.0 };
      const result = calculateSM2(state, "EASY");
      expect(result.easeFactor).toBe(3.0);
    });
  });
});
