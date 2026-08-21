"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { QrCode } from "lucide-react";
import { ScanAndPayModal } from "./ScanAndPayModal";

export function DashboardScanTrigger() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button 
        onClick={() => setOpen(true)}
        className="hidden md:inline-flex bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-6 shadow-md hover:shadow-lg transition-all h-10 gap-1.5 font-semibold"
      >
        <QrCode className="w-4 h-4 mr-1" />
        Scan QR
      </Button>

      <ScanAndPayModal open={open} onOpenChange={setOpen} />
    </>
  );
}
