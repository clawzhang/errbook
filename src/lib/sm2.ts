import type { MasteryLevel, ReviewQuality } from "@/generated/prisma/client";

interface SM2State {
  easeFactor: number;
  interval: number;
  repetitions: number;
}

interface SM2Result extends SM2State {
  nextReviewDate: Date;
  masteryLevel: MasteryLevel;
}

export function calculateSM2(
  state: SM2State,
  quality: ReviewQuality
): SM2Result {
  let { easeFactor, interval, repetitions } = state;

  switch (quality) {
    case "AGAIN":
      repetitions = 0;
      interval = 1;
      easeFactor = Math.max(1.3, easeFactor - 0.2);
      break;
    case "HARD":
      interval = Math.max(1, Math.round(interval * 0.7));
      easeFactor = Math.max(1.3, easeFactor - 0.15);
      repetitions = 0;
      break;
    case "GOOD":
      if (repetitions === 0) interval = 1;
      else if (repetitions === 1) interval = 6;
      else interval = Math.round(interval * easeFactor);
      repetitions += 1;
      break;
    case "EASY":
      interval = Math.round(interval * easeFactor * 1.3);
      easeFactor = Math.min(3.0, easeFactor + 0.15);
      repetitions += 1;
      break;
  }

  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + interval);

  let masteryLevel: MasteryLevel = "NOT_MASTERED";
  if (repetitions >= 3 && interval >= 21) masteryLevel = "MASTERED";
  else if (repetitions >= 1) masteryLevel = "PARTIALLY_MASTERED";

  return { easeFactor, interval, repetitions, nextReviewDate, masteryLevel };
}
