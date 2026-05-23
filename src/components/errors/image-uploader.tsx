"use client";

import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ImageIcon, Loader2, Camera } from "lucide-react";
import { toast } from "sonner";
import { ImageLightboxGallery } from "@/components/common/image-lightbox-gallery";

interface ImageUploaderProps {
  onOCRResult: (result: {
    question: string;
    wrongAnswer: string;
    correctAnswer: string;
    analysis: string;
    subject: string;
    knowledgePoint: string;
    errorReason: string;
  }) => void;
  onImagesChange: (urls: string[]) => void;
  images: string[];
}

export function ImageUploader({
  onOCRResult,
  onImagesChange,
  images,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [recognizing, setRecognizing] = useState(false);
  const [previewFile, setPreviewFile] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewImages = useMemo(() => {
    if (images.length > 0) {
      return Array.from(new Set(images));
    }

    return previewFile ? [previewFile] : [];
  }, [images, previewFile]);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("图片大小不能超过5MB");
      return;
    }

    // 预览
    const reader = new FileReader();
    reader.onload = (ev) => setPreviewFile(ev.target?.result as string);
    reader.readAsDataURL(file);

    // 上传图片
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/errors/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        onImagesChange(Array.from(new Set([...images, ...data.urls])));
        toast.success("图片已上传");
      } else {
        toast.error(data.error || "上传失败");
      }
    } catch {
      toast.error("上传失败");
    } finally {
      setUploading(false);
    }
  }

  async function handleOCR() {
    if (!previewFile && images.length === 0) {
      toast.error("请先上传图片");
      return;
    }

    setRecognizing(true);
    try {
      // 如果有本地预览文件，用它发送；否则用已上传的图片URL
      let res: Response;

      if (previewFile) {
        // 将 base64 转为 File 发送
        const blob = await fetch(previewFile).then((r) => r.blob());
        const formData = new FormData();
        formData.append("image", blob, "image.jpg");

        res = await fetch("/api/ai/ocr", {
          method: "POST",
          body: formData,
        });
      } else {
        // 用已上传的第一张图片 URL
        const imageUrl = images[0];
        // 需要将图片转为 base64 发送
        const imgRes = await fetch(imageUrl);
        const imgBlob = await imgRes.blob();
        const formData = new FormData();
        formData.append("image", imgBlob, "image.jpg");

        res = await fetch("/api/ai/ocr", {
          method: "POST",
          body: formData,
        });
      }

      const data = await res.json();

      if (res.ok) {
        onOCRResult(data.result);
        toast.success("AI 已识别题目内容，请检查并补充信息");
      } else {
        toast.error(data.error || "识别失败");
      }
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "识别失败，请检查 AI 配置"
      );
    } finally {
      setRecognizing(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <Camera className="h-4 w-4 mr-1" />
          )}
          {uploading ? "上传中..." : "拍照/选择图片"}
        </Button>

        {(previewFile || images.length > 0) && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleOCR}
            disabled={recognizing}
          >
            {recognizing ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <ImageIcon className="h-4 w-4 mr-1" />
            )}
            {recognizing ? "AI 识别中..." : "AI 自动识别"}
          </Button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      {previewImages.length > 0 ? (
        <ImageLightboxGallery
          images={previewImages}
          altPrefix="题目图片"
          imageClassName="h-20 w-auto"
        />
      ) : null}
    </div>
  );
}
