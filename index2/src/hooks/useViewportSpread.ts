/**
 * useViewportSpread.ts
 * ---------------------------------------------------------------------------
 * Sizing now derives from the REAL intrinsic aspect ratio of each page
 * image (not a fixed A3 mm constant). Both pages in a spread are forced to
 * the same rendered height; each page's width falls out naturally from its
 * own aspect ratio at that shared height. The two pages are then scaled as
 * ONE GROUP to fit the viewport, gap is always 0 so they touch with no seam.
 *
 * The viewport itself is still measured correctly (unchanged from the
 * earlier audit): a 100dvh/100dvw sizer + ResizeObserver, cross checked
 * against window.visualViewport, so Safari's collapsing toolbars don't
 * cause a stale reading.
 */

import { useEffect, useRef, useState } from "react";

export interface SpreadLayout {
  pageHeight: number;
  pageWidths: number[]; // one width per page, same order as input ratios
  gap: number; // always 0 — pages must touch with no seam
  spreadWidth: number;
  spreadHeight: number;
  ready: boolean;
}

/**
 * @param aspectRatios intrinsic width/height of each page currently shown,
 *   in display order (length 1 for single-page mode, length 2 for a spread)
 */
export function useViewportSpread(aspectRatios: number[]): SpreadLayout {
  const sizerRef = useRef<HTMLDivElement | null>(null);
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    const sizer = sizerRef.current ?? ensureSizerEl();
    sizerRef.current = sizer;

    const measure = () => {
      const rect = sizer.getBoundingClientRect();
      let w = rect.width;
      let h = rect.height;
      if (window.visualViewport) {
        w = Math.min(w, window.visualViewport.width);
        h = Math.min(h, window.visualViewport.height);
      }
      setBox({ w, h });
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(sizer);
    window.visualViewport?.addEventListener("resize", measure);
    window.addEventListener("orientationchange", measure);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.visualViewport?.removeEventListener("resize", measure);
      window.removeEventListener("orientationchange", measure);
      window.removeEventListener("resize", measure);
    };
  }, []);

  const haveRatios = aspectRatios.length > 0 && aspectRatios.every((ar) => ar > 0);
  if (!box || !haveRatios) {
    return { pageHeight: 0, pageWidths: [], gap: 0, spreadWidth: 0, spreadHeight: 0, ready: false };
  }

  const availW = box.w;
  const availH = box.h;
  const gap = 0; // pages must touch with zero seam

  const ratioSum = aspectRatios.reduce((sum, ar) => sum + ar, 0);

  // Largest shared page height allowed by each axis. Both pages move
  // together as one group — never scaled independently.
  const hByHeight = availH;
  const hByWidth = (availW - gap) / ratioSum;
  const pageHeight = Math.max(0, Math.min(hByHeight, hByWidth));

  const pageWidths = aspectRatios.map((ar) => ar * pageHeight);
  const spreadWidth = pageWidths.reduce((sum, w) => sum + w, 0) + gap * (aspectRatios.length - 1);

  return {
    pageHeight,
    pageWidths,
    gap,
    spreadWidth,
    spreadHeight: pageHeight,
    ready: true,
  };
}

function ensureSizerEl(): HTMLDivElement {
  const id = "__catalog_viewport_sizer__";
  let el = document.getElementById(id) as HTMLDivElement | null;
  if (el) return el;
  el = document.createElement("div");
  el.id = id;
  el.style.position = "fixed";
  el.style.top = "0";
  el.style.left = "0";
  el.style.width = "100vw";
  el.style.height = "100vh";
  // @ts-ignore progressive enhancement
  el.style.width = "100dvw";
  // @ts-ignore
  el.style.height = "100dvh";
  el.style.pointerEvents = "none";
  el.style.visibility = "hidden";
  el.style.zIndex = "-1";
  document.body.appendChild(el);
  return el;
}
