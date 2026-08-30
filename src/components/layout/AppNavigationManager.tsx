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

  // 1. If user opened the app directly on any sub-page or master, ensure
  // Dashboard (/) exists as the root in browser history so Back button never exits prematurely
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.pathname !== "/") {
      const initialized = sessionStorage.getItem("app_nav_root_initialized");
      if (!initialized) {
        sessionStorage.setItem("app_nav_root_initialized", "true");
        const currentPath = window.location.pathname;
        const currentSearch = window.location.search;

        if (currentSearch.includes("personId=")) {
          // Prepend both Dashboard (/) and Master (/people) so Back goes: detail -> master -> dashboard
          window.history.replaceState({ isRoot: true }, "", "/");
          window.history.pushState({ isMaster: true }, "", currentPath);
          window.history.pushState({ isDetail: true }, "", `${currentPath}${currentSearch}`);
        } else {
          window.history.replaceState({ isRoot: true }, "", "/");
          window.history.pushState({ path: currentPath }, "", currentPath);
        }
      }
    }
  }, []);

  // 2. Track current pathname
  useEffect(() => {
    currentPathRef.current = pathname;
  }, [pathname]);

  // 3. Handle browser / mobile back events
  useEffect(() => {
    const handlePopState = () => {
      const previousPath = currentPathRef.current;
      const currentPath = window.location.pathname;

      // Only redirect to Dashboard if popping between TWO DIFFERENT masters (e.g. /transactions -> /accounts)
      // Intra-master pops (e.g. /people?personId=... -> /people) remain on /people
      if (previousPath !== currentPath && TOP_LEVEL_MASTERS.has(previousPath) && TOP_LEVEL_MASTERS.has(currentPath)) {
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
