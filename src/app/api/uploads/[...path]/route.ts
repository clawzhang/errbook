import { NextRequest, NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import { join } from "path";

const uploadRoot = process.env.UPLOAD_DIR || "public/uploads";

const mimeTypes: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    const filepath = join(uploadRoot, ...path);

    // 安全检查：防止路径穿越
    const normalizedPath = join(uploadRoot, ...path);
    if (!normalizedPath.startsWith(uploadRoot)) {
      return NextResponse.json({ error: "非法路径" }, { status: 403 });
    }

    const fileStat = await stat(filepath);
    if (!fileStat.isFile()) {
      return NextResponse.json({ error: "文件不存在" }, { status: 404 });
    }

    const buffer = await readFile(filepath);
    const ext = path[path.length - 1].toLowerCase().match(/\.\w+$/)?.[0] || "";
    const contentType = mimeTypes[ext] || "application/octet-stream";

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("[uploads] 读取文件失败", error);
    return NextResponse.json({ error: "文件不存在" }, { status: 404 });
  }
}
