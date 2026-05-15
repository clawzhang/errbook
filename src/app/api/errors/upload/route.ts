import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";

const uploadRoot = process.env.UPLOAD_DIR || "public/uploads";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const fileList = formData.getAll("files");
    const fileItems = fileList.length > 0 ? fileList : formData.getAll("file");
    const files = fileItems as File[];

    if (files.length === 0) {
      return NextResponse.json({ error: "请选择图片" }, { status: 400 });
    }

    if (files.length > 5) {
      return NextResponse.json({ error: "最多上传5张图片" }, { status: 400 });
    }

    const uploadDir = `${uploadRoot}/${session.user.id}`;
    await mkdir(uploadDir, { recursive: true });

    const urls: string[] = [];

    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: `${file.name} 超过5MB限制` },
          { status: 400 }
        );
      }

      const ext = file.name.includes(".")
        ? `.${file.name.split(".").pop()}`
        : ".jpg";
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
      const filepath = `${uploadDir}/${filename}`;

      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(filepath, buffer);

      urls.push(`/api/uploads/${session.user.id}/${filename}`);
    }

    return NextResponse.json({ urls }, { status: 201 });
  } catch (error) {
    console.error("[upload] 写入失败", {
      uploadRoot,
      error: error instanceof Error ? { message: error.message, stack: error.stack } : error,
    });
    return NextResponse.json({ error: "上传失败" }, { status: 500 });
  }
}
