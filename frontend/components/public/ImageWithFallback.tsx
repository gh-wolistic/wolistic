"use client";

import Image, { type ImageProps } from "next/image";
import { useMemo, useState } from "react";

const ERROR_IMG_SRC =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg==";

type ImageWithFallbackProps = Omit<ImageProps, "src" | "alt"> & {
  src?: string | null;
  alt?: string;
  fallbackSrc?: string;
};

function hasSrc(value: ImageWithFallbackProps["src"]): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function shouldBypassImageOptimizer(src: string): boolean {
  try {
    const parsed = new URL(src);
    return (
      parsed.hostname.endsWith(".supabase.co") &&
      parsed.pathname.includes("/storage/v1/object/")
    );
  } catch {
    return false;
  }
}

export function ImageWithFallback({
  src,
  alt = "",
  fallbackSrc = ERROR_IMG_SRC,
  fill = true,
  sizes,
  unoptimized,
  onError,
  ...rest
}: ImageWithFallbackProps) {
  const [didError, setDidError] = useState(false);

  const resolvedSrc = useMemo(() => {
    if (didError || !hasSrc(src)) {
      return fallbackSrc;
    }
    return src;
  }, [didError, src, fallbackSrc]);

  const resolvedSizes = sizes ?? (fill ? "100vw" : undefined);
  const shouldBypassOptimization =
    Boolean(unoptimized) || shouldBypassImageOptimizer(resolvedSrc);

  const handleError: NonNullable<ImageProps["onError"]> = (event) => {
    setDidError(true);
    onError?.(event);
  };

  if (fill) {
    return (
      <span className="relative block h-full w-full">
        <Image
          src={resolvedSrc}
          alt={didError ? "Error loading image" : alt}
          fill
          sizes={resolvedSizes}
          unoptimized={shouldBypassOptimization}
          onError={handleError}
          {...rest}
        />
      </span>
    );
  }

  return (
    <Image
      src={resolvedSrc}
      alt={didError ? "Error loading image" : alt}
      sizes={resolvedSizes}
      unoptimized={shouldBypassOptimization}
      onError={handleError}
      {...rest}
    />
  );
}