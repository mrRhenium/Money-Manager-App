"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";
import { ScanAndPayModal } from "./ScanAndPayModal";

export function ScanAndPayTrigger() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Only show on Dashboard and Transactions pages
  const isTargetPage = pathname === "/" || pathname === "/transactions";
  if (!isTargetPage) return null;

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="fixed z-45 bottom-20 right-6 md:bottom-8 md:right-8 w-14 h-14 rounded-full bg-gradient-to-tr from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all hover:scale-105 flex items-center justify-center border border-primary/20 shrink-0"
        title="Scan & Pay"
      >
        <Camera className="w-6 h-6" />
      </Button>

      <ScanAndPayModal open={open} onOpenChange={setOpen} />
    </>
  );
}
