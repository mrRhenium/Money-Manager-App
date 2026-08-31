"use client";

import React, { useState, useEffect } from "react";
import * as LucideIcons from "lucide-react";
import { Input } from "@/components/ui/input";
import { Palette, Sparkles, Circle } from "lucide-react";
import { Select } from "antd";
import { SEED_ICONS } from "@/lib/iconConstants";

export const DEFAULT_COLORS = [
  "#0ea5e9", "#8b5cf6", "#f59e0b", "#ef4444", "#10b981",
  "#ec4899", "#6366f1", "#14b8a6", "#f97316", "#64748b",
];

// Helper to safely render any Lucide icon by string name
export function getLucideIcon(name: string): React.ComponentType<any> {
  if (!name) return Circle;
  const IconComp = (LucideIcons as any)[name];
  return IconComp || Circle;
}

export function DynamicLucideIcon({ 
  name, 
  className = "w-4 h-4", 
  style 
}: { 
  name: string; 
  className?: string; 
  style?: React.CSSProperties 
}) {
  const IconComp = getLucideIcon(name);
  return <IconComp className={className} style={style} />;
}

// Global cached icons for instant UI response
let cachedIcons: any[] | null = null;

export function useSystemIcons() {
  const [icons, setIcons] = useState<any[]>(cachedIcons || SEED_ICONS);
  const [loading, setLoading] = useState(!cachedIcons);

  useEffect(() => {
    let isMounted = true;
    async function loadIcons() {
      try {
        const res = await fetch("/api/icons");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0 && isMounted) {
            cachedIcons = data;
            setIcons(data);
          }
        }
      } catch (err) {
        console.error("Failed to load dynamic icons:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadIcons();
    return () => {
      isMounted = false;
    };
  }, []);

  return { icons, loading };
}

// Backward compatibility ICON_OPTIONS export
export const ICON_OPTIONS = SEED_ICONS.map((item) => ({
  name: item.name,
  icon: getLucideIcon(item.name),
  label: item.label,
  category: item.category,
}));

interface IconPickerProps {
  value: string;
  onChange: (value: string) => void;
  color?: string;
  disabled?: boolean;
}

export function IconPicker({ value, onChange, color, disabled }: IconPickerProps) {
  const { icons } = useSystemIcons();

  // Group icons by category for structured dropdown display
  const groupedCategories = React.useMemo(() => {
    const groups: { [cat: string]: any[] } = {};
    icons.forEach((item) => {
      const cat = item.category || "General";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });

    return Object.entries(groups).map(([catName, list]) => ({
      label: catName,
      options: list.map((item) => {
        const IconComp = getLucideIcon(item.name);
        return {
          label: (
            <div className="flex items-center justify-between gap-2 w-full h-full">
              <div className="flex items-center gap-2 min-w-0">
                <IconComp 
                  className="w-4 h-4 shrink-0" 
                  style={{ color: color || "currentColor" }} 
                />
                <span className="truncate leading-none">{item.label}</span>
              </div>
              <span className="text-[10px] text-muted-foreground font-mono opacity-60 shrink-0 leading-none">
                {item.name}
              </span>
            </div>
          ),
          value: item.name,
          searchTerms: `${item.label} ${item.name} ${item.category || ""} ${(item.tags || []).join(" ")}`.toLowerCase(),
        };
      }),
    }));
  }, [icons, color]);

  return (
    <div className="space-y-1.5 flex flex-col justify-end">
      <label className="text-sm font-medium flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-muted-foreground" /> Icon
      </label>
      <Select
        disabled={disabled}
        className="w-full h-10"
        value={value}
        onChange={onChange}
        showSearch
        optionLabelProp="label"
        filterOption={(input, option: any) => {
          if (!option || !option.searchTerms) return false;
          return (option.searchTerms as string).includes(input.toLowerCase());
        }}
        options={groupedCategories}
        placeholder="Select or search an icon..."
        dropdownStyle={{ maxHeight: 340, overflowY: "auto" }}
      />
    </div>
  );
}

interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  disabled?: boolean;
}

export function ColorPicker({ value, onChange, id, disabled }: ColorPickerProps) {
  const inputId = id || "colorPickerInput";
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium flex items-center gap-2">
        <Palette className="w-4 h-4 text-muted-foreground" /> Color
      </label>
      <div className="flex gap-2 items-center">
        <Input 
          type="color" 
          disabled={disabled}
          id={inputId} 
          className={`w-10 h-10 p-1 shrink-0 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`} 
          value={value} 
          onChange={(e) => onChange(e.target.value)} 
          onClick={(e) => {
            if (disabled) return;
            try {
              (e.target as HTMLInputElement).showPicker?.();
            } catch (err) {}
          }}
        />
        <div className="flex gap-1.5 flex-wrap">
          {DEFAULT_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onChange(c)}
              className={`w-7 h-7 rounded-full border-2 transition-all ${value === c ? "border-foreground scale-110" : "border-transparent hover:scale-105"}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
