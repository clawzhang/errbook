import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserAIConfig, callAI } from "@/lib/ai";
import { calculateSM2 } from "@/lib/sm2";

interface GradeItem {
  answerId: string;
  userAnswer: string;
}

interface GradeResult {
  answerId: string;
  isCorrect: boolean;
  comment: string;
}

interface AnswerWithError {
  id: string;
  errorId: string;
  error: {
    id: string;
    question: string;
    correctAnswer: string;
    subject: string;
    easeFactor: number;
    interval: number;
    repetitions: number;
  };
}

async function gradeWithAI(
  aiConfig: { baseUrl: string; apiKey: string; model: string },
  dbAnswers: AnswerWithError[],
  userAnswers: GradeItem[]
): Promise<GradeResult[]> {
  const questionsText = dbAnswers
    .map((a, i) => {
      const ua = userAnswers.find((u) => u.answerId === a.id);
      return `题目${i + 1}：${a.error.question}\n正确答案：${a.error.correctAnswer}\n学生答案：${ua?.userAnswer || "（未作答）"}`;
    })
    .join("\n\n---\n\n");

  const prompt = `你是一位严谨的阅卷老师。请逐题判断学生的答案是否正确，并给出简短点评。

判断标准：
- 答案的核心意思正确即可，不要求措辞完全一致
- 数学题要求计算结果正确，过程合理
- 语文题允许表述不同但意思相近
- 英语题注意拼写和语法
- 未作答或答案为空视为错误

请严格按以下 JSON 格式输出（不要输出其他内容，不要用 markdown 代码块包裹）：
[
  {"index": 0, "correct": true/false, "comment": "简短点评"},
  {"index": 1, "correct": true/false, "comment": "简短点评"}
]

以下是本次测试的题目和答案：

${questionsText}`;

  try {
    const response = await callAI(
      aiConfig,
      [{ role: "user", content: prompt }],
      { temperature: 0.1, maxTokens: 3000 }
    );

    const parsed = JSON.parse(response) as Array<{
      index: number;
      correct: boolean;
      comment: string;
    }>;

    return dbAnswers.map((a, i) => {
      const aiResult = parsed.find((r) => r.index === i);
      return {
        answerId: a.id,
        isCorrect: aiResult?.correct ?? false,
        comment: aiResult?.comment ?? "",
      };
    });
  } catch {
    return gradeFallback(dbAnswers, userAnswers);
  }
}

function gradeFallback(
  dbAnswers: AnswerWithError[],
  userAnswers: GradeItem[]
): GradeResult[] {
  return dbAnswers.map((a) => {
    const ua = userAnswers.find((u) => u.answerId === a.id);
    const userText = (ua?.userAnswer || "").trim();
    const correctText = a.error.correctAnswer.trim();
    const isCorrect =
      userText.length > 0 &&
      (userText === correctText ||
        userText.replace(/\s+/g, "") === correctText.replace(/\s+/g, ""));
    return {
      answerId: a.id,
      isCorrect,
      comment: isCorrect ? "回答正确" : "答案不匹配",
    };
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { sessionId } = await params;

  const testSession = await prisma.testSession.findFirst({
    where: { id: sessionId, userId: session.user.id },
    include: {
      answers: {
        include: {
          error: {
            select: {
              id: true,
              question: true,
              correctAnswer: true,
              subject: true,
              easeFactor: true,
              interval: true,
              repetitions: true,
            },
          },
        },
      },
    },
  });

  if (!testSession) {
    return NextResponse.json({ error: "未找到测试" }, { status: 404 });
  }

  if (testSession.status === "COMPLETED") {
    return NextResponse.json({ error: "测试已完成" }, { status: 400 });
  }

  const body = await request.json();
  const { answers } = body as { answers: GradeItem[] };

  if (!answers || answers.length === 0) {
    return NextResponse.json({ error: "缺少答案数据" }, { status: 400 });
  }

  const aiConfig = await getUserAIConfig(session.user.id);

  let results: GradeResult[];

  if (aiConfig) {
    results = await gradeWithAI(aiConfig, testSession.answers, answers);
  } else {
    results = gradeFallback(testSession.answers, answers);
  }

  const correctCount = results.filter((r) => r.isCorrect).length;

  await prisma.$transaction([
    ...results.map((r) => {
      const userAnswer = answers.find((a) => a.answerId === r.answerId)?.userAnswer || "";
      return prisma.testAnswer.update({
        where: { id: r.answerId },
        data: {
          userAnswer,
          isCorrect: r.isCorrect,
        },
      });
    }),
    prisma.testSession.update({
      where: { id: sessionId },
      data: {
        status: "COMPLETED",
        correctCount,
        completedAt: new Date(),
      },
    }),
  ]);

  const wrongResults = results.filter((r) => !r.isCorrect);
  if (wrongResults.length > 0) {
    const wrongAnswerRecords = testSession.answers.filter((a) =>
      wrongResults.some((r) => r.answerId === a.id)
    );

    await Promise.all(
      wrongAnswerRecords.map((wa) => {
        const sm2Result = calculateSM2(
          {
            easeFactor: wa.error.easeFactor,
            interval: wa.error.interval,
            repetitions: wa.error.repetitions,
          },
          "AGAIN"
        );

        return prisma.error.update({
          where: { id: wa.errorId },
          data: {
            easeFactor: sm2Result.easeFactor,
            interval: sm2Result.interval,
            repetitions: sm2Result.repetitions,
            nextReviewDate: sm2Result.nextReviewDate,
            masteryLevel: sm2Result.masteryLevel,
            lastReviewDate: new Date(),
          },
        });
      })
    );
  }

  return NextResponse.json({
    correctCount,
    totalQuestions: testSession.totalQuestions,
    results,
  });
}
