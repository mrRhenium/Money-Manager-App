import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

// Common style classes for consistent Light/Dark mode visibility
const commonClasses = "bg-background text-foreground text-xs border-input placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary/50 shadow-2xs transition-colors";

interface FilterInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function FilterInput({ label, className, ...props }: FilterInputProps) {
  return (
    <div className="space-y-1.5 w-full">
      <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</Label>
      <Input 
        className={cn("h-8.5 text-xs", commonClasses, className)} 
        {...props} 
      />
    </div>
  );
}

interface FilterSelectProps {
  label: string;
  value?: string | null;
  onValueChange?: (value: string | null) => void;
  placeholder?: string;
  options: { label: string; value: string }[];
  className?: string;
}

export function FilterSelect({ label, value, onValueChange, placeholder = "Select...", options, className }: FilterSelectProps) {
  return (
    <div className="space-y-1.5 w-full">
      <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</Label>
      <Select value={value} onValueChange={(val: any) => onValueChange?.(val)}>
        <SelectTrigger className={cn("h-8.5 text-xs", commonClasses, className)}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="bg-popover text-popover-foreground border-border shadow-md">
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value} className="text-xs">
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
