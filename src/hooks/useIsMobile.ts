"use client";

import { useEffect, useState } from "react";

/**
 * md-breakpoint tracker shared by the map overlays.
 * Defaults to desktop on first render (no SSR flash).
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return isMobile;
}

export default useIsMobile;
