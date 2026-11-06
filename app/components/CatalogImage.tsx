"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

type CatalogImageProps = ImageProps & { fallbackSrc?: string };

export function CatalogImage({ src, fallbackSrc, alt, ...props }: CatalogImageProps) {
  const [failedSource, setFailedSource] = useState<ImageProps["src"] | null>(null);
  return <Image {...props} alt={alt} src={failedSource === src && fallbackSrc ? fallbackSrc : src}
    onError={() => { if (fallbackSrc) setFailedSource(src); }} />;
}
