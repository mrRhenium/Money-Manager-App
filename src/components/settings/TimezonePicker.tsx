/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import TimezoneSelect from "react-timezone-select";
import { TimeZoneSelectDialog as TimezoneMap } from "react-timezone-map-select";
import { updateTimezone } from "@/actions/user";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export function TimezonePicker({ initialTimezone }: { initialTimezone: string }) {
  const { update } = useSession();
  const router = useRouter();

  const [selectedTimezone, setSelectedTimezone] = useState<{ value: string; label: string } | string>(
    initialTimezone
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const tz = typeof selectedTimezone === "string" ? selectedTimezone : selectedTimezone.value;
      await updateTimezone(tz);

      // Force session refresh so new timezone is recognized globally
      await update({ timezone: tz });
      router.refresh();

      alert("Timezone updated successfully!");
    } catch {
      alert("Failed to update timezone.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleMapChange = (timezone: string) => {
    setSelectedTimezone(timezone);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium leading-none">Interactive Map Selection</label>
        <p className="text-xs text-muted-foreground mb-4">Click the button below to visually pick your timezone on a world map.</p>
        <div>
          <Button type="button" variant="outline" onClick={() => setIsMapOpen(true)}>
            Open Interactive Map
          </Button>
          <TimezoneMap
            open={isMapOpen}
            onClose={(newTz: any) => {
              setIsMapOpen(false);
              if (newTz && typeof newTz === "string") {
                handleMapChange(newTz);
              }
            }}
            timeZoneName={typeof selectedTimezone === "string" ? selectedTimezone : selectedTimezone.value}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium leading-none">Dropdown Selection</label>
        <p className="text-xs text-muted-foreground mb-2">Or search and select from the list.</p>
        <TimezoneSelect
          value={selectedTimezone}
          onChange={setSelectedTimezone}
          className="text-foreground text-sm"
          styles={{
            control: (provided: any) => ({
              ...provided,
              backgroundColor: "transparent",
              borderColor: "hsl(var(--input))",
              borderRadius: "0.5rem",
            }),
            menu: (provided: any) => ({
              ...provided,
              backgroundColor: "hsl(var(--popover))",
              border: "1px solid hsl(var(--border))",
            }),
            option: (provided: any, state: any) => ({
              ...provided,
              backgroundColor: state.isFocused ? "hsl(var(--accent))" : "transparent",
              color: state.isFocused ? "hsl(var(--accent-foreground))" : "hsl(var(--foreground))",
            }),
            singleValue: (provided: any) => ({
              ...provided,
              color: "hsl(var(--foreground))",
            })
          }}
        />
      </div>

      <Button onClick={handleSave} disabled={isSaving}>
        {isSaving ? "Saving..." : "Save Timezone"}
      </Button>
    </div>
  );
}
