-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Error" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "knowledgePointId" TEXT,
    "grade" INTEGER NOT NULL DEFAULT 1,
    "semester" TEXT NOT NULL DEFAULT 'FIRST',
    "question" TEXT NOT NULL,
    "questionImages" TEXT NOT NULL DEFAULT '[]',
    "wrongAnswer" TEXT NOT NULL,
    "correctAnswer" TEXT NOT NULL,
    "analysis" TEXT,
    "errorReason" TEXT,
    "source" TEXT NOT NULL DEFAULT 'HOMEWORK',
    "sourceDetail" TEXT,
    "masteryLevel" TEXT NOT NULL DEFAULT 'NOT_MASTERED',
    "easeFactor" REAL NOT NULL DEFAULT 2.5,
    "interval" INTEGER NOT NULL DEFAULT 0,
    "repetitions" INTEGER NOT NULL DEFAULT 0,
    "nextReviewDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastReviewDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Error_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Error_knowledgePointId_fkey" FOREIGN KEY ("knowledgePointId") REFERENCES "KnowledgePoint" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Error" ("analysis", "correctAnswer", "createdAt", "easeFactor", "errorReason", "id", "interval", "knowledgePointId", "lastReviewDate", "masteryLevel", "nextReviewDate", "question", "questionImages", "repetitions", "source", "sourceDetail", "subject", "updatedAt", "userId", "wrongAnswer") SELECT "analysis", "correctAnswer", "createdAt", "easeFactor", "errorReason", "id", "interval", "knowledgePointId", "lastReviewDate", "masteryLevel", "nextReviewDate", "question", "questionImages", "repetitions", "source", "sourceDetail", "subject", "updatedAt", "userId", "wrongAnswer" FROM "Error";
DROP TABLE "Error";
ALTER TABLE "new_Error" RENAME TO "Error";
CREATE INDEX "Error_userId_subject_idx" ON "Error"("userId", "subject");
CREATE INDEX "Error_userId_masteryLevel_idx" ON "Error"("userId", "masteryLevel");
CREATE INDEX "Error_userId_nextReviewDate_idx" ON "Error"("userId", "nextReviewDate");
CREATE INDEX "Error_userId_grade_semester_idx" ON "Error"("userId", "grade", "semester");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "avatar" TEXT,
    "aiBaseUrl" TEXT,
    "aiApiKey" TEXT,
    "aiModel" TEXT,
    "currentGrade" INTEGER NOT NULL DEFAULT 1,
    "currentSemester" TEXT NOT NULL DEFAULT 'FIRST',
    "gradeSetAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "autoAdvance" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("aiApiKey", "aiBaseUrl", "aiModel", "avatar", "createdAt", "email", "id", "name", "passwordHash", "updatedAt") SELECT "aiApiKey", "aiBaseUrl", "aiModel", "avatar", "createdAt", "email", "id", "name", "passwordHash", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
