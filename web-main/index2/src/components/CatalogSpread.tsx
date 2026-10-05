import React, { useEffect, useState } from "react";
import { useViewportSpread } from "../hooks/useViewportSpread";
import { useImageAspectRatios } from "../hooks/useImageAspectRatios";
import { CatalogPage } from "./CatalogPage";

interface CatalogSpreadProps {
  pages: string[]; // one or two src paths, in display order
  pageNumbers: number[]; // matching page numbers, for alt text / preload
  isSpreadMode: boolean;
  resetKey: number;
}

export function CatalogSpread({ pages, pageNumbers, isSpreadMode, resetKey }: CatalogSpreadProps) {
  const measuredRatios = useImageAspectRatios(pages);
  const knownRatios = measuredRatios.every((r) => r !== null) ? (measuredRatios as number[]) : [];
  const layout = useViewportSpread(knownRatios);
  const [zoom, setZoom] = useState({ scale: 1, x: 0, y: 0 });

  useEffect(() => {
    setZoom({ scale: 1, x: 0, y: 0 });
  }, [resetKey]);

  return (
    <div className="catalog-stage">
      <div
        className="catalog-spread"
        style={{
          width: layout.ready ? layout.spreadWidth : undefined,
          height: layout.ready ? layout.spreadHeight : undefined,
          gap: layout.gap,
          opacity: layout.ready ? 1 : 0,
          transform: `translate(${zoom.x}px, ${zoom.y}px) scale(${zoom.scale})`,
        }}
      >
        {pages.map((src, i) => (
          <CatalogPage
            key={src + i}
            src={src}
            width={layout.ready ? layout.pageWidths[i] : 0}
            height={layout.ready ? layout.pageHeight : 0}
            pageNumber={pageNumbers[i]}
          />
        ))}
      </div>
    </div>
  );
}
