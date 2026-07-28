import { NextRequest, NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import { join, resolve, extname } from "path";
import { auth } from "@/lib/auth";

const uploadRoot = process.env.UPLOAD_DIR || "public/uploads";
// 归一化为绝对路径，作为路径穿越校验的唯一基准
const uploadRootAbsolute = resolve(uploadRoot);

/**
 * 可直接内联返回的图片类型。
 * 刻意不包含 SVG：SVG 可携带脚本，内联渲染会形成存储型 XSS。
 */
const inlineMimeTypes: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  // 上传目录内是用户私有资料，禁止匿名遍历
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  try {
    const { path } = await params;
    const filepathAbsolute = resolve(join(uploadRootAbsolute, ...path));

    // 基于绝对路径比较，确保 ".." 无法逃逸出上传根目录
    if (
      filepathAbsolute !== uploadRootAbsolute &&
      !filepathAbsolute.startsWith(uploadRootAbsolute + "/")
    ) {
      return NextResponse.json({ error: "非法路径" }, { status: 403 });
    }

    const fileStat = await stat(filepathAbsolute);
    if (!fileStat.isFile()) {
      return NextResponse.json({ error: "文件不存在" }, { status: 404 });
    }

    const ext = extname(filepathAbsolute).toLowerCase();
    const contentType = inlineMimeTypes[ext];

    // 非白名单类型一律以附件下载，不在浏览器中执行
    if (!contentType) {
      const buffer = await readFile(filepathAbsolute);
      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          "Content-Type": "application/octet-stream",
          "Content-Disposition": "attachment",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    const buffer = await readFile(filepathAbsolute);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "X-Content-Type-Options": "nosniff",
        // 属于登录用户的私有资源，仅允许浏览器私有缓存
        "Cache-Control": "private, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("[uploads] 读取文件失败", error);
    return NextResponse.json({ error: "文件不存在" }, { status: 404 });
  }
}
