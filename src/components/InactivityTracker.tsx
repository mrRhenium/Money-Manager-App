"use client";

import { useEffect, useRef } from "react";
import { signOut, useSession } from "next-auth/react";

export function InactivityTracker() {
  const { data: session } = useSession();
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    if (!session) return;
    
    // 2 hours in milliseconds = 2 * 60 * 60 * 1000 = 7,200,000 ms
    const INACTIVITY_LIMIT = 7200000;

    const resetTimer = () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
      timeoutIdRef.current = setTimeout(() => {
        signOut({ callbackUrl: "/login" });
      }, INACTIVITY_LIMIT);
    };

    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart"];
    
    // Use throttling for performance on high-frequency events like mousemove/scroll
    let throttleTimer: NodeJS.Timeout | null = null;
    const throttledResetTimer = () => {
      if (throttleTimer) return;
      throttleTimer = setTimeout(() => {
        resetTimer();
        throttleTimer = null;
      }, 1000); // only reset max once per second
    };

    events.forEach(event => {
      document.addEventListener(event, throttledResetTimer, { passive: true });
    });

    // Initialize timer
    resetTimer();

    return () => {
      if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
      if (throttleTimer) clearTimeout(throttleTimer);
      events.forEach(event => {
        document.removeEventListener(event, throttledResetTimer);
      });
    };
  }, [session]);

  return null;
}
