import type { UserRole } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

export function isAdminEmail(email?: string | null) {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  return Boolean(adminEmail && email?.trim().toLowerCase() === adminEmail);
}

export async function ensureAdminRole(user: {
  id: string;
  email: string | null;
  role: UserRole;
}) {
  if (!isAdminEmail(user.email) || user.role === "ADMIN") {
    return user.role;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { role: "ADMIN" },
  });

  return "ADMIN";
}

export function generateTemporaryPassword() {
  const alphabet =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const symbols = "!@#$%";
  const pick = (source: string) =>
    source[Math.floor(Math.random() * source.length)];

  const chars = [
    pick("ABCDEFGHJKLMNPQRSTUVWXYZ"),
    pick("abcdefghijkmnopqrstuvwxyz"),
    pick("23456789"),
    pick(symbols),
  ];

  for (let i = chars.length; i < 12; i += 1) {
    chars.push(pick(alphabet + symbols));
  }

  return chars.sort(() => Math.random() - 0.5).join("");
}
