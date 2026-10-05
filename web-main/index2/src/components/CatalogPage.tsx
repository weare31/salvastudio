import React, { useState } from "react";

interface CatalogPageProps {
  src: string;
  width: number;
  height: number;
  pageNumber: number;
}

export function CatalogPage({ src, width, height, pageNumber }: CatalogPageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="catalog-page catalog-page--missing" style={{ width, height }}>
        <span>Sayfa görseli bulunamadı</span>
      </div>
    );
  }

  return (
    <img
      className="catalog-page"
      src={src}
      alt={`Sayfa ${pageNumber}`}
      style={{ width, height }}
      draggable={false}
      decoding="async"
      loading="lazy"
      onError={() => {
        // eslint-disable-next-line no-console
        console.error(`[Katalog] Görsel bulunamadı: ${src}`);
        setFailed(true);
      }}
    />
  );
}
