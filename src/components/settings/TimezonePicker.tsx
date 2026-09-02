"use client";

import { useState } from "react";
import { updateTimezone } from "@/actions/user";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { AdvancedTimezonePicker } from "./AdvancedTimezonePicker";
import { Globe } from "lucide-react";
import { useToast } from "@/hooks/useToast";

export function TimezonePicker({
  initialTimezone,
  noBorder = false,
  onDone,
}: {
  initialTimezone: string;
  noBorder?: boolean;
  onDone?: () => void;
}) {
  const { update } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  const [selectedTimezone, setSelectedTimezone] = useState<string>(initialTimezone);
  const [isSaving, setIsSaving] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleSave = async (tz: string) => {
    setIsSaving(true);
    try {
      await updateTimezone(tz);

      // Force session refresh so new timezone is recognized globally
      await update({ timezone: tz });
      setSelectedTimezone(tz);
      setIsOpen(false);
      router.refresh();
      
      toast.success("Timezone updated successfully!");
    } catch {
      toast.error("Failed to update timezone.");
    } finally {
      setIsSaving(false);
    }
  };

  if (noBorder) {
    return (
      <div className="flex flex-col items-center text-center p-3 sm:p-5 pt-1 space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shadow-xs">
          <Globe className="w-7 h-7" />
        </div>
        <div className="space-y-1.5 max-w-[280px]">
          <h4 className="font-bold text-base text-foreground">Global Timezone</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            All transactions, analytics, and dates across the app will follow this timezone.
          </p>
        </div>

        <div className="w-full p-3.5 rounded-xl border bg-muted/20 flex flex-col items-center justify-center gap-1 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Current Active Timezone</span>
          <span className="text-sm sm:text-base font-bold text-foreground">{selectedTimezone}</span>
        </div>

        <div className="w-full flex flex-col gap-2.5 pt-2">
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger render={
              <Button className="w-full h-11 rounded-xl text-sm font-semibold shadow-xs flex items-center justify-center gap-2">
                <Globe className="w-4 h-4" />
                Change Timezone
              </Button>
            } />
            <DialogContent
              showCloseButton={false}
              initialFocus={false}
              size="md"
              className="!z-[1350]"
              overlayClassName="!z-[1300]"
            >
              <AdvancedTimezonePicker 
                initialTimezone={selectedTimezone} 
                onSave={handleSave} 
                onCancel={() => setIsOpen(false)}
                isSaving={isSaving}
              />
            </DialogContent>
          </Dialog>

          {onDone && (
            <Button
              type="button"
              variant="outline"
              className="w-full h-11 rounded-xl text-sm font-medium border-border/70 hover:bg-muted"
              onClick={onDone}
            >
              Done
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="p-4 border rounded-xl bg-card flex items-center justify-between">
        <div>
          <h4 className="font-semibold mb-1">Current Timezone</h4>
          <p className="text-sm text-muted-foreground">{selectedTimezone}</p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger render={
            <Button variant="outline">
              <Globe className="w-4 h-4 mr-2" />
              Change Timezone
            </Button>
          } />
          <DialogContent
            showCloseButton={false}
            initialFocus={false}
            size="md"
            className="!z-[1350]"
            overlayClassName="!z-[1300]"
          >
            <AdvancedTimezonePicker 
              initialTimezone={selectedTimezone} 
              onSave={handleSave} 
              onCancel={() => setIsOpen(false)}
              isSaving={isSaving}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
