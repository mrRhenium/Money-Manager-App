"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from "react-simple-maps";
import cityTimezones from "city-timezones";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { Globe, Search, Navigation, Check, X, Plus, Minus, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/useToast";

dayjs.extend(utc);
dayjs.extend(timezone);

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

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
    } catch (e) {
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
  const { toast } = useToast();
  const [selectedTz, setSelectedTz] = useState<string>(initialTimezone);
  const [searchQuery, setSearchQuery] = useState("");
  const [position, setPosition] = useState({ coordinates: [0, 0], zoom: 1 });
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

  useEffect(() => {
    if (selectedData && position.zoom === 1) {
      // Center map on selected timezone initially if not interacted with
      setPosition({ coordinates: [selectedData.lng, selectedData.lat], zoom: 2 });
    }
  }, []); // Only on mount

  const handleZoomIn = () => {
    if (position.zoom >= 4) return;
    setPosition(pos => ({ ...pos, zoom: pos.zoom * 1.5 }));
  };

  const handleZoomOut = () => {
    if (position.zoom <= 1) return;
    setPosition(pos => ({ ...pos, zoom: pos.zoom / 1.5 }));
  };

  const handleReset = () => {
    setPosition({ coordinates: [0, 0], zoom: 1 });
  };

  const handleMoveEnd = (position: { coordinates: [number, number], zoom: number }) => {
    setPosition(position);
  };

  const detectLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const { latitude, longitude } = pos.coords;
        // Find closest timezone
        let closest = allTimezones[0];
        let minDistance = Infinity;

        for (const tz of allTimezones) {
          // Simple euclidean distance for approximation
          const dist = Math.pow(tz.lat - latitude, 2) + Math.pow(tz.lng - longitude, 2);
          if (dist < minDistance) {
            minDistance = dist;
            closest = tz;
          }
        }

        setSelectedTz(closest.id);
        setPosition({ coordinates: [closest.lng, closest.lat], zoom: 3 });
        
        // Try to guess from Intl if available for better accuracy
        try {
          const systemTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
          if (uniqueTimezones.has(systemTz)) {
            setSelectedTz(systemTz);
            const sysData = uniqueTimezones.get(systemTz)!;
            setPosition({ coordinates: [sysData.lng, sysData.lat], zoom: 3 });
          }
        } catch (e) {}

      }, (err) => {
        toast.error("Could not detect location: " + err.message);
      });
    } else {
      toast.warning("Geolocation is not supported by your browser.");
    }
  };

  return (
    <div className="flex flex-col bg-background rounded-xl overflow-hidden h-[80vh] min-h-[600px] border border-border shadow-xl">
      {/* Header */}
      <div className="flex items-center px-6 py-4 border-b border-border bg-card/50">
        <Globe className="w-5 h-5 mr-3 text-primary" />
        <h2 className="text-lg font-semibold">Select Timezone</h2>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden relative flex-col md:flex-row">
        
        {/* Map Section (Left) */}
        <div className="flex-1 relative bg-[#f8fafc] dark:bg-[#0f172a] overflow-hidden">
          <Button 
            variant="secondary" 
            size="sm" 
            className="absolute top-4 left-4 z-10 shadow-md bg-background/90 backdrop-blur"
            onClick={detectLocation}
          >
            <Navigation className="w-4 h-4 mr-2" />
            Detect my location
          </Button>

          <div className="absolute bottom-4 right-4 z-10 flex gap-2">
            <Button variant="secondary" size="icon" className="w-8 h-8 shadow-md bg-background/90" onClick={handleZoomIn}><Plus className="w-4 h-4" /></Button>
            <Button variant="secondary" size="icon" className="w-8 h-8 shadow-md bg-background/90" onClick={handleZoomOut}><Minus className="w-4 h-4" /></Button>
            <Button variant="secondary" size="icon" className="w-8 h-8 shadow-md bg-background/90" onClick={handleReset}><RotateCcw className="w-4 h-4" /></Button>
          </div>

          <ComposableMap 
            projection="geoMercator" 
            projectionConfig={{ scale: 140 }}
            className="w-full h-full outline-none"
          >
            <ZoomableGroup 
              zoom={position.zoom} 
              center={position.coordinates as [number, number]} 
              onMoveEnd={handleMoveEnd}
            >
              <Geographies geography={geoUrl}>
                {({ geographies }) =>
                  geographies.map((geo) => (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill="var(--color-slate-200)"
                      stroke="var(--color-slate-300)"
                      strokeWidth={0.5}
                      className="dark:fill-slate-800 dark:stroke-slate-700 outline-none"
                    />
                  ))
                }
              </Geographies>

              {allTimezones.map((tz) => {
                const isSelected = selectedTz === tz.id;
                return (
                  <Marker 
                    key={tz.id} 
                    coordinates={[tz.lng, tz.lat]}
                    onClick={() => {
                      setSelectedTz(tz.id);
                      setPosition({ coordinates: [tz.lng, tz.lat], zoom: Math.max(position.zoom, 2) });
                    }}
                    className="cursor-pointer"
                  >
                    {isSelected && (
                      <circle r={8} fill="var(--primary)" className="animate-ping opacity-20" />
                    )}
                    <circle 
                      r={isSelected ? 5 : 2.5} 
                      fill={isSelected ? "hsl(var(--primary))" : "var(--color-slate-400)"} 
                      stroke={isSelected ? "#fff" : "transparent"} 
                      strokeWidth={1.5} 
                      className={cn(
                        "transition-all duration-300", 
                        !isSelected && "hover:fill-primary hover:r-4 dark:fill-slate-500"
                      )} 
                    />
                  </Marker>
                );
              })}
            </ZoomableGroup>
          </ComposableMap>
        </div>

        {/* List Section (Right) */}
        <div className="w-full md:w-[380px] flex flex-col border-l border-border bg-card">
          <div className="p-4 border-b border-border space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Search timezone, city, country..." 
                className="pl-9 h-10 bg-background"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <p className="text-xs text-muted-foreground font-medium">{filteredTimezones.length} timezones available</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-1" ref={listRef}>
            {filteredTimezones.map(tz => {
              const isSelected = selectedTz === tz.id;
              const localTime = currentTime.tz(tz.id);
              
              return (
                <button
                  key={tz.id}
                  onClick={() => {
                    setSelectedTz(tz.id);
                    setPosition({ coordinates: [tz.lng, tz.lat], zoom: Math.max(position.zoom, 2) });
                  }}
                  className={cn(
                    "w-full text-left p-3 rounded-lg flex items-center justify-between transition-all duration-200 border",
                    isSelected 
                      ? "bg-primary/10 border-primary ring-1 ring-primary/20 shadow-sm" 
                      : "bg-transparent border-transparent hover:bg-secondary/50 hover:border-border"
                  )}
                >
                  <div className="flex flex-col gap-1 overflow-hidden pr-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-primary">{tz.formattedOffset}</span>
                      <span className="text-sm font-medium truncate text-foreground">{tz.id}</span>
                    </div>
                    <span className="text-xs text-muted-foreground truncate">{tz.city}, {tz.country}</span>
                  </div>
                  
                  <div className="flex flex-col items-end shrink-0 gap-1">
                    <span className="text-sm font-bold">{localTime.format("h:mm A")}</span>
                    {isSelected ? (
                      <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                        <Check className="w-3 h-3" />
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">{tz.formattedOffset}</span>
                    )}
                  </div>
                </button>
              );
            })}
            
            {filteredTimezones.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                <p>No timezones found.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Footer */}
      <div className="flex items-center justify-between p-4 border-t border-border bg-card shrink-0">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase mb-1">Current Timezone</span>
          <div className="flex items-center gap-3">
            <span className="font-bold text-foreground">{selectedTz || "Not Selected"}</span>
            {selectedData && (
              <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                {selectedData.formattedOffset}
              </span>
            )}
          </div>
          {selectedData && (
            <span className="text-xs text-muted-foreground mt-1">
              {currentTime.tz(selectedData.id).format("DD-MM-YY, h:mm A")}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={onCancel} disabled={isSaving}>Cancel</Button>
          <Button onClick={() => selectedTz && onSave(selectedTz)} disabled={!selectedTz || isSaving}>
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

    </div>
  );
}
