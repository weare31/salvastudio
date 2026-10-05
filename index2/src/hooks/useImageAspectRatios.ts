import { useEffect, useState } from "react";

/**
 * Returns the intrinsic width/height ratio of each src, in the same order.
 * Entries are `null` until that image's natural dimensions are known
 * (decoded). Uses a tiny in-memory cache so revisiting a page (e.g. via
 * prev/next) doesn't redecode just to read dimensions again.
 */
const ratioCache = new Map<string, number>();

export function useImageAspectRatios(srcs: string[]): (number | null)[] {
  const [ratios, setRatios] = useState<(number | null)[]>(
    () => srcs.map((s) => ratioCache.get(s) ?? null)
  );

  useEffect(() => {
    let cancelled = false;
    setRatios(srcs.map((s) => ratioCache.get(s) ?? null));

    srcs.forEach((src, i) => {
      if (ratioCache.has(src)) return;
      const img = new Image();
      img.onload = () => {
        if (cancelled || !img.naturalWidth || !img.naturalHeight) return;
        const ratio = img.naturalWidth / img.naturalHeight;
        ratioCache.set(src, ratio);
        setRatios((prev) => {
          const next = [...prev];
          next[i] = ratio;
          return next;
        });
      };
      // onError: leave as null — CatalogPage's own onError already shows
      // the "Sayfa görseli bulunamadı" fallback and logs to console.
      img.src = src;
    });

    return () => {
      cancelled = true;
    };
  }, [srcs.join("|")]);

  return ratios;
}
