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
        className="hidden md:inline-flex bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8 shadow-md hover:shadow-lg transition-all h-12 gap-2 font-semibold text-sm"
      >
        <ScanLine className="w-5 h-5" />
        Scan & Pay
      </Button>

      <ScanAndPayModal open={open} onOpenChange={setOpen} />
    </>
  );
}
