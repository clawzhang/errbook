"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DashboardPage, EmptyStateCard } from "@/components/layout/dashboard-shell";
import { KeyRound, RefreshCw, Search, ShieldCheck, Users } from "lucide-react";
import { toast } from "sonner";

interface AdminUser {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  role: "USER" | "ADMIN";
  createdAt: string;
  updatedAt: string;
  _count: {
    errors: number;
    reviews: number;
    testSessions: number;
  };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [customPasswords, setCustomPasswords] = useState<Record<string, string>>({});

  const filteredUsers = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return users;

    return users.filter((user) =>
      `${user.name} ${user.email}`.toLowerCase().includes(keyword)
    );
  }, [query, users]);

  async function loadUsers() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();

      if (res.ok) {
        setUsers(data.users || []);
      } else {
        toast.error(data.error || "加载用户失败");
      }
    } catch {
      toast.error("加载用户失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      void loadUsers();
    });
  }, []);

  async function resetPassword(user: AdminUser, useCustomPassword: boolean) {
    const password = customPasswords[user.id]?.trim();
    if (useCustomPassword && (!password || password.length < 6)) {
      toast.error("新密码至少6位");
      return;
    }

    setResettingId(user.id);
    setNewPassword("");

    try {
      const res = await fetch(`/api/admin/users/${user.id}/password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(useCustomPassword ? { password } : {}),
      });
      const data = await res.json();

      if (res.ok) {
        setNewPassword(data.password);
        setCustomPasswords((prev) => ({ ...prev, [user.id]: "" }));
        toast.success(`已重置 ${user.name} 的密码`);
      } else {
        toast.error(data.error || "重置密码失败");
      }
    } catch {
      toast.error("重置密码失败");
    } finally {
      setResettingId(null);
    }
  }

  function copyPassword() {
    if (!newPassword) return;
    void navigator.clipboard.writeText(newPassword);
    toast.success("新密码已复制");
  }

  if (loading) {
    return (
      <DashboardPage>
        <EmptyStateCard title="用户加载中" description="正在读取用户列表，请稍候。" />
      </DashboardPage>
    );
  }

  return (
    <DashboardPage className="gap-4">
      <section className="dashboard-panel px-4 py-3 md:px-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-[1rem] bg-blue-50 text-primary">
              <Users className="size-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-950">用户管理</p>
              <p className="text-xs text-muted-foreground">
                管理员可查看用户并为忘记密码的用户重置密码
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => void loadUsers()}>
            <RefreshCw className="size-4" />
            刷新
          </Button>
        </div>
      </section>

      {newPassword ? (
        <Card className="border-emerald-100 bg-emerald-50/80">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold text-emerald-800">密码已重置</p>
              <p className="mt-1 text-sm text-emerald-700">
                新密码只显示一次，请复制后告知对应用户。
              </p>
              <code className="mt-2 inline-flex rounded-lg bg-white/80 px-3 py-2 text-sm font-bold text-emerald-900">
                {newPassword}
              </code>
            </div>
            <Button size="sm" onClick={copyPassword}>
              复制新密码
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="size-4" />
            用户列表
          </CardTitle>
          <CardDescription>
            当前仅开放密码重置能力，不提供删除用户或查看用户错题内容。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索用户名或邮箱"
              className="pl-10"
            />
          </div>

          <div className="space-y-3">
            {filteredUsers.map((user) => {
              const initials = user.name
                ? user.name.slice(0, 2)
                : user.email.slice(0, 2).toUpperCase();
              const customPassword = customPasswords[user.id] || "";

              return (
                <div
                  key={user.id}
                  className="rounded-[1.2rem] border border-white/80 bg-white/80 p-4 shadow-[0_10px_24px_rgba(59,101,176,0.06)]"
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar className="size-11">
                        {user.avatar ? (
                          <AvatarImage src={user.avatar} alt={user.name} />
                        ) : null}
                        <AvatarFallback className="bg-blue-50 text-sm font-bold text-primary">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-bold text-slate-950">
                            {user.name}
                          </p>
                          <Badge variant={user.role === "ADMIN" ? "default" : "outline"}>
                            {user.role === "ADMIN" ? "管理员" : "普通用户"}
                          </Badge>
                        </div>
                        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          注册于 {format(new Date(user.createdAt), "yyyy-MM-dd HH:mm")} ·
                          错题 {user._count.errors} · 复习 {user._count.reviews} · 测试{" "}
                          {user._count.testSessions}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-[minmax(180px,240px)_auto_auto] sm:items-end">
                      <div className="space-y-1.5">
                        <Label className="text-xs">指定新密码</Label>
                        <Input
                          type="text"
                          value={customPassword}
                          onChange={(event) =>
                            setCustomPasswords((prev) => ({
                              ...prev,
                              [user.id]: event.target.value,
                            }))
                          }
                          placeholder="留空可随机生成"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={resettingId === user.id}
                        onClick={() => void resetPassword(user, false)}
                      >
                        <KeyRound className="size-4" />
                        随机重置
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        disabled={resettingId === user.id || customPassword.length < 6}
                        onClick={() => void resetPassword(user, true)}
                      >
                        使用指定密码
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredUsers.length === 0 ? (
              <EmptyStateCard title="没有匹配用户" description="换一个关键词再试。" />
            ) : null}
          </div>
        </CardContent>
      </Card>
    </DashboardPage>
  );
}
