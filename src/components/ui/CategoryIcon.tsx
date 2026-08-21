import * as LucideIcons from "lucide-react";

interface CategoryIconProps {
  name?: string;
  color?: string;
  className?: string;
}

export function CategoryIcon({ name, color, className = "w-4 h-4" }: CategoryIconProps) {
  // Safe lookup with fallback
  const IconComponent = name && (LucideIcons as any)[name] 
    ? (LucideIcons as any)[name] 
    : LucideIcons.Circle;

  return (
    <IconComponent 
      className={className} 
      style={color ? { color } : undefined} 
    />
  );
}
