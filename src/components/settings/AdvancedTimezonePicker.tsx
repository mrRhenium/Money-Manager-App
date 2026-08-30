"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import cityTimezones from "city-timezones";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { Globe, Search, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

dayjs.extend(utc);
dayjs.extend(timezone);

interface TzData {
  id: string;
  lat: number;
  lng: number;
  city: string;
  country: string;
  offset: number;
  formattedOffset: string;
}

// Prepare timezone data once
const uniqueTimezones = new Map<string, TzData>();
cityTimezones.cityMapping.forEach((city: any) => {
  if (city.timezone && !uniqueTimezones.has(city.timezone)) {
    try {
      const now = dayjs().tz(city.timezone);
      const offset = now.utcOffset();
      const hours = Math.floor(Math.abs(offset) / 60);
      const minutes = Math.abs(offset) % 60;
      const formattedOffset = `UTC${offset >= 0 ? '+' : '-'}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      
      uniqueTimezones.set(city.timezone, {
        id: city.timezone,
        lat: city.lat,
        lng: city.lng,
        city: city.city,
        country: city.country,
        offset,
        formattedOffset
      });
    } catch {
      // Ignore invalid timezones
    }
  }
});

const allTimezones = Array.from(uniqueTimezones.values()).sort((a, b) => a.offset - b.offset);

interface AdvancedTimezonePickerProps {
  initialTimezone: string;
  onSave: (timezone: string) => void;
  onCancel: () => void;
  isSaving?: boolean;
}

export function AdvancedTimezonePicker({ initialTimezone, onSave, onCancel, isSaving }: AdvancedTimezonePickerProps) {
  const [selectedTz, setSelectedTz] = useState<string>(initialTimezone);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentTime, setCurrentTime] = useState(dayjs());
  const listRef = useRef<HTMLDivElement>(null);

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(dayjs()), 60000);
    return () => clearInterval(timer);
  }, []);

  const filteredTimezones = useMemo(() => {
    if (!searchQuery) return allTimezones;
    const lowerQuery = searchQuery.toLowerCase();
    return allTimezones.filter(tz => 
      tz.id.toLowerCase().includes(lowerQuery) || 
      tz.city.toLowerCase().includes(lowerQuery) || 
      tz.country.toLowerCase().includes(lowerQuery) ||
      tz.formattedOffset.toLowerCase().includes(lowerQuery)
    );
  }, [searchQuery]);

  const selectedData = uniqueTimezones.get(selectedTz);

  return (
    <div className="flex flex-col bg-card rounded-2xl overflow-hidden h-[85vh] sm:h-[80vh] max-h-[680px] w-full border-none shadow-none">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-card/70 shrink-0">
        <div className="flex items-center gap-2.5">
          <Globe className="w-5 h-5 text-primary" />
          <h2 className="text-base sm:text-lg font-bold text-foreground">Select Timezone</h2>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
          onClick={onCancel}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden bg-card w-full">
        {/* Search Bar */}
        <div className="p-3.5 sm:p-4 border-b border-border space-y-2 shrink-0 bg-muted/10">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Search timezone, city, country..." 
              className="pl-9 h-10 bg-background rounded-xl text-xs sm:text-sm"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <p className="text-[11px] sm:text-xs text-muted-foreground font-medium">{filteredTimezones.length} timezones available</p>
        </div>
        
        {/* Scrollable Timezones List */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-2 sm:p-3 space-y-1 custom-scrollbar" ref={listRef}>
          {filteredTimezones.map(tz => {
            const isSelected = selectedTz === tz.id;
            const localTime = currentTime.tz(tz.id);
            
            return (
              <button
                key={tz.id}
                type="button"
                onClick={() => setSelectedTz(tz.id)}
                className={cn(
                  "w-full text-left p-3 rounded-xl flex items-center justify-between transition-all duration-200 border",
                  isSelected 
                    ? "bg-primary/10 border-primary ring-1 ring-primary/20 shadow-2xs" 
                    : "bg-transparent border-transparent hover:bg-secondary/60 hover:border-border/60"
                )}
              >
                <div className="flex flex-col gap-1 overflow-hidden pr-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-primary">{tz.formattedOffset}</span>
                    <span className="text-xs sm:text-sm font-semibold truncate text-foreground">{tz.id}</span>
                  </div>
                  <span className="text-[11px] sm:text-xs text-muted-foreground truncate">{tz.city}, {tz.country}</span>
                </div>
                
                <div className="flex flex-col items-end shrink-0 gap-1">
                  <span className="text-xs sm:text-sm font-bold text-foreground">{localTime.format("h:mm A")}</span>
                  {isSelected ? (
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                      <Check className="w-3 h-3" />
                    </div>
                  ) : (
                    <span className="text-[11px] text-muted-foreground">{tz.formattedOffset}</span>
                  )}
                </div>
              </button>
            );
          })}
          
          {filteredTimezones.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              <p className="text-xs sm:text-sm">No timezones found matching &quot;{searchQuery}&quot;</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer: Vertically stacked and full width in both laptop and mobile view */}
      <div className="flex flex-col gap-3.5 p-4 border-t border-border bg-card shrink-0 w-full">
        <div className="flex flex-col w-full">
          <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase mb-1">Current Timezone</span>
          <div className="flex items-center gap-2.5 flex-wrap w-full">
            <span className="font-bold text-foreground text-sm sm:text-base">{selectedTz || "Not Selected"}</span>
            {selectedData && (
              <span className="text-xs font-semibold bg-primary/10 text-primary px-2.5 py-0.5 rounded-full">
                {selectedData.formattedOffset}
              </span>
            )}
          </div>
          {selectedData && (
            <span className="text-xs text-muted-foreground mt-1 font-medium">
              {currentTime.tz(selectedData.id).format("DD-MM-YY, h:mm A")}
            </span>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-3 w-full pt-1">
          <Button
            type="button"
            variant="outline"
            className="w-full h-10 rounded-xl text-xs sm:text-sm font-semibold border-border/70 hover:bg-muted"
            onClick={onCancel}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="w-full h-10 rounded-xl text-xs sm:text-sm font-semibold shadow-xs"
            onClick={() => selectedTz && onSave(selectedTz)}
            disabled={!selectedTz || isSaving}
          >
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}
