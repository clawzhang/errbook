"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  BookOpenText,
  Bot,
  BrainCircuit,
  ClipboardList,
  GraduationCap,
  Grid2X2,
  LogOut,
  Menu,
  NotebookPen,
  Settings,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/errors", label: "错题集", icon: BookOpenText },
  { href: "/subjects", label: "按学科", icon: Grid2X2 },
  { href: "/knowledge", label: "按知识点", icon: BrainCircuit },
  { href: "/tests", label: "考试记录", icon: ClipboardList },
  { href: "/plans", label: "复习计划", icon: GraduationCap },
  { href: "/stats", label: "统计分析", icon: Bot },
];

function isNavActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarContent({
  pathname,
  user,
}: {
  pathname: string;
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string | null;
  };
}) {
  const router = useRouter();
  const initials = user.name
    ? user.name.slice(0, 2)
    : user.email?.slice(0, 2).toUpperCase() || "U";

  async function handleSignOut() {
    await signOut({ redirect: false, callbackUrl: "/login" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <div className="rounded-[2rem] border border-white/70 bg-white/86 px-4 py-5 shadow-[0_18px_42px_rgba(59,101,176,0.08)] backdrop-blur-xl">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-[1.1rem] bg-linear-to-br from-primary via-primary to-sky-400 text-white shadow-[0_18px_34px_rgba(58,114,224,0.28)]">
            <NotebookPen className="size-6" />
          </div>
          <div>
            <p className="text-lg font-black tracking-[-0.04em] text-slate-950">错题集</p>
            <p className="text-xs font-medium text-slate-400">
              错中学，学中进
            </p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = isNavActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group flex items-center gap-3 rounded-[1.25rem] px-4 py-3 text-sm font-semibold transition-all duration-200",
                active
                  ? "bg-linear-to-r from-primary via-primary to-sky-400 text-white shadow-[0_18px_34px_rgba(58,114,224,0.24)]"
                  : "bg-white/62 text-slate-600 hover:bg-white/86 hover:text-slate-900"
              )}
            >
              <div
                className={cn(
                  "flex size-9 items-center justify-center rounded-[1rem] border border-white/70 transition-all",
                  active
                    ? "bg-white/20 text-white"
                    : "bg-slate-50 text-slate-500 group-hover:bg-blue-50 group-hover:text-primary"
                )}
              >
                <Icon className="size-4.5" />
              </div>
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="rounded-[1.6rem] border border-white/70 bg-linear-to-b from-sky-50 via-white to-white p-3 shadow-[0_18px_38px_rgba(59,101,176,0.08)]">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                className="h-auto w-full justify-start gap-3 rounded-[1.2rem] px-3 py-3"
              />
            }
          >
            <Avatar className="size-10">
              {user.image ? <AvatarImage src={user.image} alt={user.name || "用户头像"} /> : null}
              <AvatarFallback className="bg-blue-50 text-sm font-bold text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 text-left">
              <p className="truncate text-sm font-bold text-slate-900">
                {user.name || "学习小能手"}
              </p>
              <p className="truncate text-xs text-slate-400">{user.email}</p>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-56">
            <DropdownMenuItem render={<Link href="/settings" />}>
              <Settings className="mr-2 size-4" />
              设置
            </DropdownMenuItem>
            {user.role === "ADMIN" ? (
              <DropdownMenuItem render={<Link href="/settings/users" />}>
                <Users className="mr-2 size-4" />
                用户管理
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => void handleSignOut()}
            >
              <LogOut className="mr-2 size-4" />
              退出登录
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export function Sidebar({
  user,
}: {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string | null;
  };
}) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-[252px] shrink-0 xl:flex">
      <div className="sticky top-0 h-screen w-full px-3 py-4">
        <div className="h-full rounded-[2rem] border border-white/70 bg-sidebar shadow-[0_22px_60px_rgba(59,101,176,0.09)] backdrop-blur-xl">
          <SidebarContent pathname={pathname} user={user} />
        </div>
      </div>
    </aside>
  );
}

export function MobileNav({
  user,
}: {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string | null;
  };
}) {
  const pathname = usePathname();

  return (
    <div className="xl:hidden">
      <Sheet>
        <div className="flex items-center justify-between rounded-[1.6rem] border border-white/70 bg-white/82 px-4 py-3 shadow-[0_16px_40px_rgba(59,101,176,0.08)] backdrop-blur-xl">
          <SheetTrigger render={<Button variant="ghost" size="icon-sm" />}>
            <Menu className="size-5" />
          </SheetTrigger>
          <Link href="/" className="flex items-center gap-2">
            <div className="flex size-10 items-center justify-center rounded-[1rem] bg-linear-to-br from-primary via-primary to-sky-400 text-white shadow-[0_18px_34px_rgba(58,114,224,0.24)]">
              <NotebookPen className="size-5" />
            </div>
            <div>
              <p className="text-sm font-black tracking-[-0.04em] text-slate-950">错题集</p>
              <p className="text-[11px] text-slate-400">错中学，学中进</p>
            </div>
          </Link>
          <div className="w-9" />
        </div>
        <SheetContent side="left" className="w-[292px] border-none bg-transparent p-3 shadow-none" showCloseButton={false}>
          <SheetTitle className="sr-only">导航菜单</SheetTitle>
          <div className="h-full rounded-[2rem] border border-white/70 bg-sidebar shadow-[0_26px_70px_rgba(59,101,176,0.1)] backdrop-blur-xl">
            <SidebarContent pathname={pathname} user={user} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
