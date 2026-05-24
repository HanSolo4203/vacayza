"use client";

import { useEffect, useMemo, useState } from "react";
import {
  property24FallbackUrls,
  toProperty24DisplayUrl,
  type Property24ImageSize,
} from "../../lib/property24-images";

export default function Property24Image({
  src,
  alt,
  size = "gallery",
  fill,
  className = "",
  priority = false,
}: {
  src: string;
  alt: string;
  size?: Property24ImageSize;
  fill?: boolean;
  className?: string;
  priority?: boolean;
}) {
  const fallbacks = useMemo(() => property24FallbackUrls(src, size), [src, size]);
  const [index, setIndex] = useState(0);
  const url = fallbacks[index] ?? toProperty24DisplayUrl(src, size);

  useEffect(() => {
    setIndex(0);
  }, [src, size]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={alt}
      referrerPolicy="no-referrer"
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      className={fill ? `absolute inset-0 h-full w-full ${className}` : className}
      onError={() => {
        setIndex((current) => (current < fallbacks.length - 1 ? current + 1 : current));
      }}
    />
  );
}
