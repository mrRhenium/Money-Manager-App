"use client";

import { useEffect, useRef } from "react";
import { signOut, useSession } from "next-auth/react";

const INACTIVITY_LIMIT_MS = 2 * 60 * 60 * 1000; // 2 hours in ms = 7,200,000 ms
const STORAGE_KEY = "money_manager_last_active";
const COOKIE_KEY = "money_manager_last_active";

export function InactivityTracker() {
  const { data: session } = useSession();
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  const isLoggingOutRef = useRef(false);

  useEffect(() => {
    if (!session?.user) return;

    // Set cookie helper
    const updateCookie = (timestamp: number) => {
      document.cookie = `${COOKIE_KEY}=${timestamp}; path=/; max-age=${2 * 60 * 60}; SameSite=Lax`;
    };

    // Perform auto logout
    const triggerAutoLogout = () => {
      if (isLoggingOutRef.current) return;
      isLoggingOutRef.current = true;

      try {
        localStorage.removeItem(STORAGE_KEY);
        document.cookie = `${COOKIE_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
      } catch (_) {}

      signOut({ callbackUrl: "/login?reason=inactivity" });
    };

    // Check if inactivity limit has passed
    const checkInactivity = () => {
      if (isLoggingOutRef.current) return;
      
      const stored = localStorage.getItem(STORAGE_KEY);
      const now = Date.now();

      if (!stored) {
        // First run or restored session - record current time
        localStorage.setItem(STORAGE_KEY, String(now));
        updateCookie(now);
        scheduleTimeout(INACTIVITY_LIMIT_MS);
        return;
      }

      const lastActive = parseInt(stored, 10);
      if (isNaN(lastActive)) {
        localStorage.setItem(STORAGE_KEY, String(now));
        updateCookie(now);
        scheduleTimeout(INACTIVITY_LIMIT_MS);
        return;
      }

      const elapsed = now - lastActive;
      if (elapsed >= INACTIVITY_LIMIT_MS) {
        triggerAutoLogout();
      } else {
        const remaining = INACTIVITY_LIMIT_MS - elapsed;
        scheduleTimeout(remaining);
      }
    };

    // Schedule next timer for exact remaining time
    const scheduleTimeout = (delayMs: number) => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
      timeoutIdRef.current = setTimeout(() => {
        checkInactivity();
      }, Math.max(delayMs, 1000));
    };

    // Record user activity
    let throttleTimer: NodeJS.Timeout | null = null;
    const recordUserActivity = () => {
      if (isLoggingOutRef.current) return;
      if (throttleTimer) return;

      throttleTimer = setTimeout(() => {
        const now = Date.now();
        localStorage.setItem(STORAGE_KEY, String(now));
        updateCookie(now);
        scheduleTimeout(INACTIVITY_LIMIT_MS);
        throttleTimer = null;
      }, 2000); // Throttled to once every 2 seconds
    };

    // Events to watch for user activity
    const events = ["mousedown", "keydown", "touchstart", "scroll", "click", "wheel"];
    events.forEach(event => {
      window.addEventListener(event, recordUserActivity, { passive: true });
    });

    // Check immediately on mount
    checkInactivity();

    // Check when window gains focus or tab becomes visible (handles sleep, closed lid, background throttling)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkInactivity();
      }
    };
    const handleFocus = () => {
      checkInactivity();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    // Cross-tab synchronization
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        if (!e.newValue) {
          triggerAutoLogout();
        } else {
          checkInactivity();
        }
      }
    };
    window.addEventListener("storage", handleStorageEvent);

    // Periodic heartbeat check every 30 seconds
    const heartbeatInterval = setInterval(() => {
      checkInactivity();
    }, 30000);

    return () => {
      if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
      if (throttleTimer) clearTimeout(throttleTimer);
      clearInterval(heartbeatInterval);
      events.forEach(event => {
        window.removeEventListener(event, recordUserActivity);
      });
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("storage", handleStorageEvent);
    };
  }, [session]);

  return null;
}
