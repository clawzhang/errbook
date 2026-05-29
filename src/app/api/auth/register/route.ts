import { NextRequest } from "next/server";
import { withApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { ConflictError } from "@/lib/errors";
import bcrypt from "bcryptjs";
import { z } from "zod";

const registerSchema = z.object({
  email: z.string().email("邮箱格式不正确"),
  name: z.string().min(2, "用户名至少2个字符").max(20, "用户名最多20个字符"),
  password: z.string().min(6, "密码至少6位").max(50, "密码最多50位"),
});

export const POST = withApiHandler(
  async (request: NextRequest) => {
    const { email, name, password } = (request as any).validatedBody;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictError("该邮箱已被注册");
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, name, passwordHash },
    });

    return { user: { id: user.id, email: user.email, name: user.name } };
  },
  { bodySchema: registerSchema }
);
