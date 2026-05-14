import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const profileSchema = z.object({
  name: z.string().trim().min(2, "用户名至少2个字符").max(20, "用户名最多20个字符"),
  avatar: z.string().trim().optional().nullable(),
});

function isValidAvatarPath(value: string | null | undefined) {
  if (!value) return true;
  return value.startsWith("/uploads/");
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, name: true, avatar: true },
  });

  if (!user) {
    return NextResponse.json({ error: "用户不存在" }, { status: 404 });
  }

  return NextResponse.json(user);
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const result = profileSchema.safeParse(body);

    if (!result.success) {
      const firstError =
        Object.values(result.error.flatten().fieldErrors)[0]?.[0] || "输入信息有误";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const avatar = result.data.avatar || null;
    if (!isValidAvatarPath(avatar)) {
      return NextResponse.json({ error: "头像地址无效" }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: result.data.name,
        avatar,
      },
      select: { email: true, name: true, avatar: true },
    });

    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: "保存失败" }, { status: 500 });
  }
}
