import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export function buildPageGroups(total: number): number[][] {
  if (total <= 0) return [];
  const groups: number[][] = [[1]];
  let i = 2;
  while (i < total) {
    groups.push([i, i + 1]);
    i += 2;
  }
  if (i === total) groups.push([total]); // tek başına arka kapak
  return groups;
}

export function useCatalogNavigation(totalPages: number, isSpreadMode: boolean) {
  const [currentPage, setCurrentPage] = useState(1);
  const prevModeRef = useRef(isSpreadMode);
  const [resetKey, setResetKey] = useState(0);

  const groups = useMemo(
    () =>
      isSpreadMode
        ? buildPageGroups(totalPages)
        : Array.from({ length: totalPages }, (_, i) => [i + 1]),
    [totalPages, isSpreadMode]
  );

  const activeGroupIndex = useMemo(() => {
    const idx = groups.findIndex((g) => g.includes(currentPage));
    return idx === -1 ? 0 : idx;
  }, [groups, currentPage]);

  const activeGroup = groups[activeGroupIndex] ?? [];

  // Mod (tek sayfa <-> çift sayfa) gerçekten değiştiğinde zoom sıfırlansın.
  useEffect(() => {
    if (prevModeRef.current !== isSpreadMode) {
      prevModeRef.current = isSpreadMode;
      setResetKey((k) => k + 1);
    }
  }, [isSpreadMode]);

  const goTo = useCallback(
    (page: number) => setCurrentPage(Math.min(Math.max(1, page), Math.max(1, totalPages))),
    [totalPages]
  );

  const next = useCallback(() => {
    const last = activeGroup[activeGroup.length - 1] ?? currentPage;
    goTo(last + 1);
  }, [activeGroup, currentPage, goTo]);

  const prev = useCallback(() => {
    const first = activeGroup[0] ?? currentPage;
    const idx = groups.findIndex((g) => g[0] === first);
    const prevGroup = groups[idx - 1];
    goTo(prevGroup ? prevGroup[0] : first - 1);
  }, [activeGroup, groups, goTo]);

  return {
    currentPage,
    activeGroup,
    activeGroupIndex,
    totalGroups: groups.length,
    resetKey,
    goTo,
    next,
    prev,
  };
}
