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

export function TimezonePicker({ initialTimezone, noBorder = false }: { initialTimezone: string; noBorder?: boolean }) {
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

  return (
    <div className={noBorder ? "" : "space-y-4"}>
      <div className={noBorder ? "flex items-center justify-between py-1 bg-transparent" : "p-4 border rounded-xl bg-card flex items-center justify-between"}>
        <div>
          <h4 className={noBorder ? "text-sm font-semibold" : "font-semibold mb-1"}>Current Timezone</h4>
          <p className="text-sm text-muted-foreground">{selectedTimezone}</p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger render={
            <Button variant="outline">
              <Globe className="w-4 h-4 mr-2" />
              Change Timezone
            </Button>
          } />
          <DialogContent className="max-w-[90vw] w-[1000px] p-0 overflow-hidden bg-transparent border-none shadow-none">
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
