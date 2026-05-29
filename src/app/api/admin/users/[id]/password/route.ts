import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { withApiHandler } from "@/lib/api-handler";
import { generateTemporaryPassword } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { NotFoundError, AuthorizationError } from "@/lib/errors";

const passwordSchema = z.object({
  password: z.string().min(6, "密码至少6位").max(50, "密码最多50位").optional(),
});

export const PATCH = withApiHandler(
  async (request: NextRequest, { params }) => {
    const user = (request as any).user;

    if (user.role !== "ADMIN") {
      throw new AuthorizationError("需要管理员权限");
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const data = (request as any).validatedBody || passwordSchema.parse(body);

    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true },
    });

    if (!targetUser) {
      throw new NotFoundError("用户");
    }

    const password = data.password || generateTemporaryPassword();
    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: targetUser.id },
      data: { passwordHash },
    });

    return {
      success: true,
      password,
    };
  },
  { requireAuth: true, bodySchema: passwordSchema }
);
