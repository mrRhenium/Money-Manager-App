"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { syncExchangeRates } from "@/actions/currency";
import { RefreshCw } from "lucide-react";
import { message } from "antd";

export function CurrencySyncButton() {
  const [loading, setLoading] = useState(false);

  const handleSync = async () => {
    setLoading(true);
    try {
      const res = await syncExchangeRates();
      if (res.success) {
        message.success("Exchange rates synced successfully");
      } else {
        message.error(res.error || "Failed to sync exchange rates");
      }
    } catch (error) {
      message.error("An error occurred during sync");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleSync} disabled={loading} variant="outline">
      <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
      {loading ? "Syncing..." : "Sync Latest Rates"}
    </Button>
  );
}
