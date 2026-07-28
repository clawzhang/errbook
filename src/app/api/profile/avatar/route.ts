import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import { auth } from "@/lib/auth";

const uploadRoot = process.env.UPLOAD_DIR || "public/uploads";

// 仅接受可安全内联渲染的位图格式，扩展名由 MIME 推导而非客户端文件名
const allowedTypes: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("avatar") || formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "请选择头像图片" }, { status: 400 });
    }

    if (!allowedTypes[file.type]) {
      return NextResponse.json(
        { error: "头像仅支持 JPG、PNG、WebP 或 GIF 图片" },
        { status: 400 }
      );
    }

    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: "头像图片不能超过2MB" }, { status: 400 });
    }

    const uploadDir = `${uploadRoot}/${session.user.id}/avatar`;
    await mkdir(uploadDir, { recursive: true });

    const filename = `avatar-${Date.now()}${allowedTypes[file.type]}`;
    const filepath = `${uploadDir}/${filename}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filepath, buffer);

    return NextResponse.json(
      { url: `/api/uploads/${session.user.id}/avatar/${filename}` },
      { status: 201 }
    );
  } catch (error) {
    console.error("[avatar] 写入失败", {
      uploadRoot,
      error: error instanceof Error ? { message: error.message, stack: error.stack } : error,
    });
    return NextResponse.json({ error: "头像上传失败" }, { status: 500 });
  }
}
