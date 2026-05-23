import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: "file:./prisma/dev.db",
});

const prisma = new PrismaClient({ adapter });

async function main() {
  // 语文知识点
  await prisma.knowledgePoint.createMany({
    data: [
      { id: "cn-1", subject: "CHINESE", name: "字音字形", sortOrder: 1 },
      { id: "cn-2", subject: "CHINESE", name: "词语运用", sortOrder: 2 },
      { id: "cn-3", subject: "CHINESE", name: "病句辨析", sortOrder: 3 },
      { id: "cn-4", subject: "CHINESE", name: "文言文阅读", sortOrder: 4 },
      { id: "cn-5", subject: "CHINESE", name: "现代文阅读", sortOrder: 5 },
      { id: "cn-6", subject: "CHINESE", name: "古诗文默写", sortOrder: 6 },
      { id: "cn-7", subject: "CHINESE", name: "作文", sortOrder: 7 },
      { id: "cn-8", subject: "CHINESE", name: "修辞手法", parentId: "cn-5", sortOrder: 1 },
      { id: "cn-9", subject: "CHINESE", name: "文章主旨", parentId: "cn-5", sortOrder: 2 },
      { id: "cn-10", subject: "CHINESE", name: "人物描写", parentId: "cn-5", sortOrder: 3 },
    ],
  });

  // 数学知识点
  await prisma.knowledgePoint.createMany({
    data: [
      { id: "math-1", subject: "MATH", name: "代数", sortOrder: 1 },
      { id: "math-2", subject: "MATH", name: "几何", sortOrder: 2 },
      { id: "math-3", subject: "MATH", name: "函数", sortOrder: 3 },
      { id: "math-4", subject: "MATH", name: "概率统计", sortOrder: 4 },
      { id: "math-5", subject: "MATH", name: "三角函数", sortOrder: 5 },
      { id: "math-6", subject: "MATH", name: "数列", sortOrder: 6 },
      { id: "math-7", subject: "MATH", name: "向量", sortOrder: 7 },
      { id: "math-8", subject: "MATH", name: "一元二次方程", parentId: "math-1", sortOrder: 1 },
      { id: "math-9", subject: "MATH", name: "不等式", parentId: "math-1", sortOrder: 2 },
      { id: "math-10", subject: "MATH", name: "指数运算", parentId: "math-1", sortOrder: 3 },
      { id: "math-11", subject: "MATH", name: "一次函数", parentId: "math-3", sortOrder: 1 },
      { id: "math-12", subject: "MATH", name: "二次函数", parentId: "math-3", sortOrder: 2 },
      { id: "math-13", subject: "MATH", name: "反比例函数", parentId: "math-3", sortOrder: 3 },
      { id: "math-14", subject: "MATH", name: "三角形", parentId: "math-2", sortOrder: 1 },
      { id: "math-15", subject: "MATH", name: "圆", parentId: "math-2", sortOrder: 2 },
    ],
  });

  // 英语知识点
  await prisma.knowledgePoint.createMany({
    data: [
      { id: "en-1", subject: "ENGLISH", name: "词汇", sortOrder: 1 },
      { id: "en-2", subject: "ENGLISH", name: "语法", sortOrder: 2 },
      { id: "en-3", subject: "ENGLISH", name: "阅读理解", sortOrder: 3 },
      { id: "en-4", subject: "ENGLISH", name: "完形填空", sortOrder: 4 },
      { id: "en-5", subject: "ENGLISH", name: "写作", sortOrder: 5 },
      { id: "en-6", subject: "ENGLISH", name: "听力", sortOrder: 6 },
      { id: "en-7", subject: "ENGLISH", name: "时态", parentId: "en-2", sortOrder: 1 },
      { id: "en-8", subject: "ENGLISH", name: "从句", parentId: "en-2", sortOrder: 2 },
      { id: "en-9", subject: "ENGLISH", name: "非谓语动词", parentId: "en-2", sortOrder: 3 },
      { id: "en-10", subject: "ENGLISH", name: "虚拟语气", parentId: "en-2", sortOrder: 4 },
    ],
  });

  console.log("知识点种子数据已插入");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
