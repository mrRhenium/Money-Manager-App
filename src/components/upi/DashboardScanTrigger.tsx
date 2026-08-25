"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScanLine } from "lucide-react";
import { ScanAndPayModal } from "./ScanAndPayModal";

export function DashboardScanTrigger() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button 
        onClick={() => setOpen(true)}
        className="hidden sm:flex items-center justify-center h-9 sm:h-11 px-4 sm:px-6 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs sm:text-sm transition-all shadow-sm"
      >
        <ScanLine className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
        <span className="hidden sm:inline">Scan & Pay</span>
        <span className="inline sm:hidden">Scan</span>
      </Button>

      <ScanAndPayModal open={open} onOpenChange={setOpen} />
    </>
  );
}
