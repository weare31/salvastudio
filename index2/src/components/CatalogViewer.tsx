import React, { useMemo, useState } from "react";
import { resolveCatalogPages, catalogConfig } from "../config/catalog";
import { useOrientation, useIsMobileViewport } from "../hooks/useOrientation";
import { useCatalogNavigation, buildPageGroups } from "../hooks/useCatalogNavigation";
import { CatalogSpread } from "./CatalogSpread";
import { ViewerControls } from "./ViewerControls";
import { OrientationPrompt } from "./OrientationPrompt";

const SESSION_KEY = "catalog_continue_portrait";

export function CatalogViewer() {
  const pages = useMemo(resolveCatalogPages, []);
  const orientation = useOrientation();
  const isMobile = useIsMobileViewport();

  const [continuePortrait, setContinuePortrait] = useState(
    () => typeof sessionStorage !== "undefined" && sessionStorage.getItem(SESSION_KEY) === "1"
  );

  const isSpreadMode = orientation === "landscape";
  const showOrientationPrompt = isMobile && orientation === "portrait" && !continuePortrait;

  const nav = useCatalogNavigation(pages.length, isSpreadMode);

  const handleContinuePortrait = () => {
    sessionStorage.setItem(SESSION_KEY, "1");
    setContinuePortrait(true);
  };

  const handleFullscreen = () => {
    const el = document.documentElement;
    if (!document.fullscreenElement) el.requestFullscreen?.();
    else document.exitFullscreen?.();
  };

  if (pages.length === 0) {
    return <div className="catalog-empty">Katalog sayfası bulunamadı. public/catalog/ klasörünü kontrol edin.</div>;
  }

  if (showOrientationPrompt) {
    return <OrientationPrompt onContinuePortrait={handleContinuePortrait} />;
  }

  const activeSrcs = nav.activeGroup.map((n) => pages[n - 1]);
  const groups = buildPageGroups(pages.length);
  const counterLabel =
    nav.activeGroup.length === 2
      ? `${pad(nav.activeGroup[0])}-${pad(nav.activeGroup[1])} / ${pages.length}`
      : `${pad(nav.activeGroup[0])} / ${pages.length}`;

  return (
    <>
      <CatalogSpread
        pages={activeSrcs}
        pageNumbers={nav.activeGroup}
        isSpreadMode={isSpreadMode}
        resetKey={nav.resetKey}
      />
      <ViewerControls
        counterLabel={counterLabel}
        onPrev={nav.prev}
        onNext={nav.next}
        onFullscreen={handleFullscreen}
      />
    </>
  );
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}
