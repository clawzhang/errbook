"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ImageLightboxGalleryProps {
  images: string[];
  altPrefix?: string;
  emptyText?: string;
  imageClassName?: string;
  wrapperClassName?: string;
  dialogImageClassName?: string;
}

export function ImageLightboxGallery({
  images,
  altPrefix = "图片",
  emptyText,
  imageClassName,
  wrapperClassName,
  dialogImageClassName,
}: ImageLightboxGalleryProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const [imageSizes, setImageSizes] = useState<
    Record<string, { width: number; height: number }>
  >({});
  const [viewportSize, setViewportSize] = useState(() => ({
    width: typeof window !== "undefined" ? window.innerWidth : 1280,
    height: typeof window !== "undefined" ? window.innerHeight : 900,
  }));

  const normalizedImages = useMemo(
    () => Array.from(new Set(images.filter(Boolean))),
    [images]
  );

  const activeImage =
    activeIndex === null ? null : normalizedImages[activeIndex] || null;
  const activeImageSize = activeImage ? imageSizes[activeImage] : null;
  const maxDialogWidth = viewportSize.width * 0.96 - 24;
  const maxDialogHeight = viewportSize.height * 0.94 - 24;
  const fitScale = activeImageSize
    ? Math.min(
        maxDialogWidth / activeImageSize.width,
        maxDialogHeight / activeImageSize.height
      )
    : 1;
  const fittedWidth = activeImageSize
    ? Math.max(240, Math.round(activeImageSize.width * fitScale))
    : undefined;
  const fittedHeight = activeImageSize
    ? Math.max(180, Math.round(activeImageSize.height * fitScale))
    : undefined;
  const dialogStyle =
    fittedWidth && fittedHeight
      ? {
          width: `${Math.min(fittedWidth + 24, viewportSize.width * 0.96)}px`,
          height: `${Math.min(fittedHeight + 24, viewportSize.height * 0.94)}px`,
        }
      : undefined;

  useEffect(() => {
    function handleResize() {
      setViewportSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (normalizedImages.length === 0) {
    return emptyText ? (
      <p className="text-sm text-muted-foreground">{emptyText}</p>
    ) : null;
  }

  function clampZoom(value: number) {
    return Math.min(4, Math.max(0.5, value));
  }

  function handleWheel(event: React.WheelEvent<HTMLDivElement>) {
    event.preventDefault();
    const delta = event.deltaY > 0 ? -0.12 : 0.12;
    setZoom((current) => clampZoom(Number((current + delta).toFixed(2))));
  }

  function handleOpenChange(open: boolean, index: number) {
    setActiveIndex(open ? index : null);
    setZoom(1);
  }

  function rememberImageSize(
    src: string,
    event: React.SyntheticEvent<HTMLImageElement>
  ) {
    const target = event.currentTarget;
    const width = target.naturalWidth || target.width;
    const height = target.naturalHeight || target.height;

    if (!width || !height) return;

    setImageSizes((current) => {
      const existing = current[src];
      if (existing?.width === width && existing?.height === height) {
        return current;
      }

      return {
        ...current,
        [src]: { width, height },
      };
    });
  }

  return (
    <>
      <div className={cn("flex flex-wrap gap-2", wrapperClassName)}>
        {normalizedImages.map((src, index) => (
          <Dialog
            key={`${src}-${index}`}
            open={activeIndex === index}
            onOpenChange={(open) => handleOpenChange(open, index)}
          >
            <DialogTrigger
              render={
                <button
                  type="button"
                  className="overflow-hidden rounded border transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary/40"
                  aria-label={`查看${altPrefix}${index + 1}大图`}
                />
              }
            >
              <Image
                src={src}
                alt={`${altPrefix} ${index + 1}`}
                width={320}
                height={240}
                unoptimized
                className={cn(
                  "max-h-32 w-auto max-w-full object-contain bg-white",
                  imageClassName
                )}
              />
            </DialogTrigger>
            <DialogContent
              className="h-fit max-h-[94vh] w-fit max-w-[96vw] border border-white/80 bg-white/92 p-2 shadow-2xl shadow-slate-900/12 backdrop-blur-xl sm:max-w-[96vw] sm:p-3"
              style={dialogStyle}
            >
              <DialogTitle className="sr-only">
                {altPrefix}
                {index + 1}
                大图预览
              </DialogTitle>
              {activeImage ? (
                <div
                  className="flex h-full w-full items-center justify-center overflow-hidden rounded-xl bg-slate-50/80"
                  onWheel={handleWheel}
                >
                  <Image
                    src={activeImage}
                    alt={`${altPrefix} ${index + 1} 大图`}
                    width={activeImageSize?.width || 1600}
                    height={activeImageSize?.height || 1200}
                    unoptimized
                    onLoad={(event) => rememberImageSize(activeImage, event)}
                    onDoubleClick={() => setZoom(1)}
                    className={cn(
                      "rounded-lg object-contain transition-transform duration-150",
                      dialogImageClassName
                    )}
                    style={{
                      width: fittedWidth ? `${fittedWidth}px` : "auto",
                      height: fittedHeight ? `${fittedHeight}px` : "auto",
                      transform: `scale(${zoom})`,
                    }}
                  />
                </div>
              ) : null}
            </DialogContent>
          </Dialog>
        ))}
      </div>
    </>
  );
}
