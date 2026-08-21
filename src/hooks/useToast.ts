"use client";

import { App } from "antd";

/**
 * Custom hook that returns the Ant Design message API.
 * Usage:
 *   const { toast } = useToast();
 *   toast.success("Saved!");
 *   toast.error("Something went wrong");
 *   toast.info("Please wait...");
 *   toast.warning("Check your input");
 */
export function useToast() {
  const { message } = App.useApp();
  return { toast: message };
}
