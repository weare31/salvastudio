import { useEffect, useState } from "react";

export type Orientation = "portrait" | "landscape";

function readOrientation(): Orientation {
  if (typeof window === "undefined") return "landscape";
  return window.matchMedia("(orientation: landscape)").matches ? "landscape" : "portrait";
}

/** Detects orientation without ever trying to lock it (browsers block that). */
export function useOrientation(): Orientation {
  const [orientation, setOrientation] = useState<Orientation>(readOrientation);

  useEffect(() => {
    const mq = window.matchMedia("(orientation: landscape)");
    const update = () => setOrientation(mq.matches ? "landscape" : "portrait");
    mq.addEventListener("change", update);
    window.addEventListener("orientationchange", update);
    window.addEventListener("resize", update);
    return () => {
      mq.removeEventListener("change", update);
      window.removeEventListener("orientationchange", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return orientation;
}

/** True on a small/touch-primary screen, used to decide when to show the
 * rotate prompt (we don't want it on a landscape-only desktop window). */
export function useIsMobileViewport(): boolean {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches
  );
  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    const update = () => setIsMobile(mq.matches);
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return isMobile;
}
