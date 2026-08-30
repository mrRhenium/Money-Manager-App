"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

// Set of top-level master routes (Level 2)
export const TOP_LEVEL_MASTERS = new Set([
  "/accounts",
  "/credit-cards",
  "/categories",
  "/people",
  "/transactions",
  "/budgets",
  "/subscriptions",
  "/loans",
  "/goals",
  "/investments",
  "/insurance",
  "/audit-logs",
  "/settings",
  "/my-upi",
  "/admin/dashboard",
  "/admin/users",
  "/admin/currencies",
  "/admin/icons",
  "/admin/analytics",
]);

/**
 * AppNavigationManager enforces the Hub-and-Spoke navigation model:
 * 1. Details (Level 3) -> Master (Level 2)
 * 2. Master (Level 2) -> Dashboard (Level 1)
 *
 * When on any master page, pressing the browser or hardware back button
 * returns cleanly to the Dashboard (/) rather than cycling backwards
 * through previously visited masters.
 */
export function AppNavigationManager() {
  const pathname = usePathname();
  const router = useRouter();
  const currentPathRef = useRef(pathname);

  useEffect(() => {
    currentPathRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    const handlePopState = () => {
      const currentPath = currentPathRef.current;
      // If the user triggers back while on a top-level master, route directly to Dashboard
      if (TOP_LEVEL_MASTERS.has(currentPath)) {
        router.replace("/");
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [router]);

  return null;
}
