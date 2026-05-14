import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import { auth } from "@/lib/auth";

const uploadRoot = process.env.UPLOAD_DIR || "public/uploads";
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function getExtension(file: File) {
  if (file.name.includes(".")) {
    return `.${file.name.split(".").pop()?.toLowerCase() || "jpg"}`;
  }

  if (file.type === "image/png") return ".png";
  if (file.type === "image/webp") return ".webp";
  if (file.type === "image/gif") return ".gif";
  return ".jpg";
}

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

    if (!allowedTypes.has(file.type)) {
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

    const filename = `avatar-${Date.now()}${getExtension(file)}`;
    const filepath = `${uploadDir}/${filename}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filepath, buffer);

    return NextResponse.json(
      { url: `/uploads/${session.user.id}/avatar/${filename}` },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "头像上传失败" }, { status: 500 });
  }
}
