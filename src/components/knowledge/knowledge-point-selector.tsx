"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Edit3, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface KnowledgePointNode {
  id: string;
  name: string;
  subject?: string;
  parentId?: string | null;
  sortOrder?: number;
  children: { id: string; name: string }[];
}

export interface FlatKnowledgePoint {
  id: string;
  name: string;
}

interface KnowledgePointSelectorProps {
  subject: string;
  value: string;
  onChange: (value: string) => void;
  onPointsLoaded?: (points: FlatKnowledgePoint[]) => void;
  pendingKnowledgePointName?: string;
  onPendingKnowledgePointHandled?: () => void;
}

export function flattenKnowledgePoints(points: KnowledgePointNode[]) {
  return points.flatMap((point) => [
    { id: point.id, name: point.name },
    ...point.children.map((child) => ({ id: child.id, name: `  ${child.name}` })),
  ]);
}

export function KnowledgePointSelector({
  subject,
  value,
  onChange,
  onPointsLoaded,
  pendingKnowledgePointName,
  onPendingKnowledgePointHandled,
}: KnowledgePointSelectorProps) {
  const [points, setPoints] = useState<KnowledgePointNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");

  const flatPoints = useMemo(() => flattenKnowledgePoints(points), [points]);
  const selectedPoint = flatPoints.find((point) => point.id === value);

  function mergePointIntoList(point: FlatKnowledgePoint) {
    setPoints((current) => {
      const exists = current.some((item) => item.id === point.id);
      if (exists) {
        return current.map((item) =>
          item.id === point.id ? { ...item, name: point.name } : item
        );
      }

      return [
        ...current,
        {
          id: point.id,
          name: point.name,
          children: [],
        },
      ];
    });
  }

  const loadKnowledgePoints = useCallback(async (subj = subject) => {
    if (!subj) {
      setPoints([]);
      onPointsLoaded?.([]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/knowledge-points?subject=${subj}`);
      const data = await res.json();
      const nextPoints = Array.isArray(data) ? data : [];
      setPoints(nextPoints);
      onPointsLoaded?.(flattenKnowledgePoints(nextPoints));
    } catch {
      setPoints([]);
      onPointsLoaded?.([]);
    } finally {
      setLoading(false);
    }
  }, [onPointsLoaded, subject]);

  const createKnowledgePoint = useCallback(async (name: string) => {
    const res = await fetch("/api/knowledge-points", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, name }),
    });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "创建知识点失败");
    }

    return data as FlatKnowledgePoint;
  }, [subject]);

  async function handleSave() {
    const name = draftName.trim();
    if (!subject) {
      toast.error("请先选择科目");
      return;
    }
    if (!name) {
      toast.error("请输入知识点名称");
      return;
    }

    setSaving(true);
    try {
      if (mode === "edit") {
        if (!value) {
          toast.error("请先选择要编辑的知识点");
          return;
        }

        const res = await fetch("/api/knowledge-points", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: value, name }),
        });
        const data = await res.json();

        if (!res.ok) {
          toast.error(data.error || "更新知识点失败");
          return;
        }

        mergePointIntoList(data as FlatKnowledgePoint);
        toast.success("知识点已更新");
      } else {
        const point = await createKnowledgePoint(name);
        mergePointIntoList(point);
        onChange(point.id);
        toast.success("知识点已添加");
      }

      await loadKnowledgePoints();
      setDialogOpen(false);
      setDraftName("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "保存知识点失败");
    } finally {
      setSaving(false);
    }
  }

  function openCreateDialog() {
    setMode("create");
    setDraftName("");
    setDialogOpen(true);
  }

  function openEditDialog() {
    if (!selectedPoint) {
      toast.error("请先选择知识点");
      return;
    }

    setMode("edit");
    setDraftName(selectedPoint.name.trim());
    setDialogOpen(true);
  }

  useEffect(() => {
    void Promise.resolve().then(() => loadKnowledgePoints(subject));
  }, [loadKnowledgePoints, subject]);

  useEffect(() => {
    async function applyPendingKnowledgePoint() {
      const name = pendingKnowledgePointName?.trim();
      if (!subject || !name) return;

      try {
        const point = await createKnowledgePoint(name);
        onChange(point.id);
        await loadKnowledgePoints();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "自动创建知识点失败");
      } finally {
        onPendingKnowledgePointHandled?.();
      }
    }

    applyPendingKnowledgePoint();
  }, [
    createKnowledgePoint,
    loadKnowledgePoints,
    onChange,
    onPendingKnowledgePointHandled,
    pendingKnowledgePointName,
    subject,
  ]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label>知识点</Label>
        <div className="flex gap-1.5">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={openCreateDialog}
              disabled={!subject}
            >
              <Plus className="size-4" />
              <span className="sr-only">新增知识点</span>
            </Button>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {mode === "create" ? "新增知识点" : "编辑知识点"}
                </DialogTitle>
                <DialogDescription>
                  知识点会按当前科目归类，用于错题筛选、统计和复习定位。
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <Label>名称</Label>
                <Input
                  value={draftName}
                  onChange={(event) => setDraftName(event.target.value)}
                  placeholder="例如：一元二次方程"
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  取消
                </Button>
                <Button type="button" onClick={handleSave} disabled={saving}>
                  {saving ? "保存中..." : "保存"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={openEditDialog}
            disabled={!value}
          >
            <Edit3 className="size-4" />
            <span className="sr-only">编辑知识点</span>
          </Button>
        </div>
      </div>

      <div className="flex gap-2">
        <Select value={value} onValueChange={(next) => onChange(next || "")} disabled={!subject}>
          <SelectTrigger>
            <SelectValue
              placeholder={
                subject
                  ? loading
                    ? "正在加载知识点"
                    : "选择知识点，不选则默认为其他"
                  : "请先选择科目"
              }
            >
              {selectedPoint?.name.trim() || null}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {flatPoints.map((point) => (
              <SelectItem key={point.id} value={point.id}>
                {point.name}
              </SelectItem>
            ))}
            {subject && flatPoints.length === 0 && (
              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                暂无知识点，可直接新增；保存错题时也会默认归为其他。
              </div>
            )}
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={openCreateDialog}
          disabled={!subject}
        >
          <Plus className="size-4" />
          <span className="sr-only">新增知识点</span>
        </Button>
      </div>
    </div>
  );
}
