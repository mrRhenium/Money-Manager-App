"use client";

import * as LucideIcons from "lucide-react";
import { Input } from "@/components/ui/input";
import { Palette, Sparkles } from "lucide-react";

export const ICON_OPTIONS = [
  { name: "ShoppingBag", icon: LucideIcons.ShoppingBag, label: "Shopping" },
  { name: "Utensils", icon: LucideIcons.Utensils, label: "Food" },
  { name: "Car", icon: LucideIcons.Car, label: "Transport" },
  { name: "Home", icon: LucideIcons.Home, label: "Housing" },
  { name: "Zap", icon: LucideIcons.Zap, label: "Utilities" },
  { name: "HeartPulse", icon: LucideIcons.HeartPulse, label: "Medical" },
  { name: "GraduationCap", icon: LucideIcons.GraduationCap, label: "Education" },
  { name: "Tv", icon: LucideIcons.Tv, label: "Entertainment" },
  { name: "DollarSign", icon: LucideIcons.DollarSign, label: "Salary" },
  { name: "TrendingUp", icon: LucideIcons.TrendingUp, label: "Investment" },
  { name: "Gift", icon: LucideIcons.Gift, label: "Gifts" },
  { name: "Repeat", icon: LucideIcons.Repeat, label: "Recurring" },
  { name: "Shield", icon: LucideIcons.Shield, label: "Insurance" },
  { name: "Users", icon: LucideIcons.Users, label: "People" },
  { name: "Wallet", icon: LucideIcons.Wallet, label: "Wallet" },
  { name: "Landmark", icon: LucideIcons.Landmark, label: "Bank" },
  { name: "Smartphone", icon: LucideIcons.Smartphone, label: "Mobile" },
  { name: "Briefcase", icon: LucideIcons.Briefcase, label: "Work" },
  { name: "PiggyBank", icon: LucideIcons.PiggyBank, label: "Savings" },
  { name: "CircleDollarSign", icon: LucideIcons.CircleDollarSign, label: "Money" },
  { name: "Bitcoin", icon: LucideIcons.Bitcoin, label: "Crypto" },
  { name: "Building2", icon: LucideIcons.Building2, label: "Real Estate" },
  { name: "Gem", icon: LucideIcons.Gem, label: "Gold" },
  { name: "Circle", icon: LucideIcons.Circle, label: "Other" },
];

export const DEFAULT_COLORS = [
  "#0ea5e9", "#8b5cf6", "#f59e0b", "#ef4444", "#10b981",
  "#ec4899", "#6366f1", "#14b8a6", "#f97316", "#64748b",
];

interface IconPickerProps {
  value: string;
  onChange: (value: string) => void;
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-muted-foreground" /> Icon
      </label>
      <div className="grid grid-cols-6 sm:grid-cols-8 gap-1.5 p-2 border rounded-xl bg-muted/10 max-h-[130px] overflow-y-auto">
        {ICON_OPTIONS.map((item) => {
          const IconComponent = item.icon;
          const isSelected = value === item.name;
          return (
            <button
              key={item.name}
              type="button"
              onClick={() => onChange(item.name)}
              title={item.label}
              className={`flex items-center justify-center p-2 rounded-lg border transition-all ${
                isSelected
                  ? "bg-primary text-white border-primary shadow-sm"
                  : "bg-card text-muted-foreground hover:bg-muted border-transparent"
              }`}
            >
              <IconComponent className="w-4 h-4" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
}

export function ColorPicker({ value, onChange, id }: ColorPickerProps) {
  const inputId = id || "colorPickerInput";
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium flex items-center gap-2">
        <Palette className="w-4 h-4 text-muted-foreground" /> Color
      </label>
      <div className="flex gap-2 items-center">
        <Input type="color" id={inputId} className="w-10 h-10 p-1 shrink-0 cursor-pointer" value={value} onChange={(e) => onChange(e.target.value)} />
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
