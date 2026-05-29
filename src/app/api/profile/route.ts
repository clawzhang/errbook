import { NextRequest } from "next/server";
import { z } from "zod";
import { withApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { NotFoundError, ValidationError } from "@/lib/errors";

const profileSchema = z.object({
  name: z.string().trim().min(2, "用户名至少2个字符").max(20, "用户名最多20个字符"),
  avatar: z.string().trim().optional().nullable(),
});

function isValidAvatarPath(value: string | null | undefined) {
  if (!value) return true;
  return value.startsWith("/api/uploads/");
}

export const GET = withApiHandler(
  async (request: NextRequest) => {
    const userId = (request as any).user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true, avatar: true },
    });

    if (!user) {
      throw new NotFoundError("用户");
    }

    return user;
  },
  { requireAuth: true }
);

export const PUT = withApiHandler(
  async (request: NextRequest) => {
    const userId = (request as any).user.id;
    const data = (request as any).validatedBody;

    const avatar = data.avatar || null;
    if (!isValidAvatarPath(avatar)) {
      throw new ValidationError("头像地址无效");
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        avatar,
      },
      select: { email: true, name: true, avatar: true },
    });

    return user;
  },
  { requireAuth: true, bodySchema: profileSchema }
);
