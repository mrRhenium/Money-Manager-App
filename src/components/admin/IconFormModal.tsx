"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch, Select, message } from "antd";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Pencil, Sparkles, Tag, FolderTree, Search, Check } from "lucide-react";
import { createIcon, updateIcon } from "@/actions/icon";
import { DynamicLucideIcon, getLucideIcon } from "@/components/ui/IconColorPicker";
import * as LucideIcons from "lucide-react";

const CATEGORIES = [
  "Finance",
  "Shopping",
  "Food & Dining",
  "Transport",
  "Housing",
  "Health",
  "Education",
  "Work",
  "Entertainment",
  "Family",
  "Investments",
  "General",
];

// Curated list of popular Lucide icon names for easy selection in admin
const POPULAR_LUCIDE_NAMES = Object.keys(LucideIcons).filter((key) => {
  return typeof (LucideIcons as any)[key] === "object" || typeof (LucideIcons as any)[key] === "function";
});

interface IconFormModalProps {
  icon?: any;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function IconFormModal({ icon, onSuccess, trigger }: IconFormModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState(icon?.name || "Sparkles");
  const [label, setLabel] = useState(icon?.label || "");
  const [category, setCategory] = useState(icon?.category || "General");
  const [tagsInput, setTagsInput] = useState((icon?.tags || []).join(", "));
  const [isActive, setIsActive] = useState(icon?.isActive !== undefined ? icon.isActive : true);
  const [iconSearch, setIconSearch] = useState("");

  const isEditing = Boolean(icon?._id);

  const filteredIconNames = POPULAR_LUCIDE_NAMES.filter((n) =>
    n.toLowerCase().includes(iconSearch.toLowerCase())
  ).slice(0, 72);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      message.error("Please choose a valid Lucide icon name");
      return;
    }
    if (!label.trim()) {
      message.error("Please provide a display label");
      return;
    }

    setLoading(true);
    try {
      const tags = tagsInput
        .split(",")
        .map((t: string) => t.trim().toLowerCase())
        .filter((t: string) => t.length > 0);

      if (isEditing) {
        const res = await updateIcon(icon._id, {
          label,
          category,
          tags,
          isActive,
        });
        if (res.success) {
          message.success("Icon updated successfully");
          setOpen(false);
          onSuccess?.();
        } else {
          message.error(res.error || "Failed to update icon");
        }
      } else {
        const res = await createIcon({
          name,
          label,
          category,
          tags,
          isActive,
        });
        if (res.success) {
          message.success("Icon created successfully");
          setOpen(false);
          setLabel("");
          setTagsInput("");
          onSuccess?.();
        } else {
          message.error(res.error || "Failed to create icon");
        }
      }
    } catch (err: any) {
      message.error(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger render={trigger as any} />
      ) : isEditing ? (
        <DialogTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:text-primary transition-colors text-muted-foreground hover:bg-muted"
              title="Edit Icon"
            >
              <Pencil className="w-4 h-4" />
            </Button>
          }
        />
      ) : (
        <DialogTrigger
          render={
            <Button className="h-9 px-4 text-xs sm:text-sm font-semibold rounded-xl shadow-xs">
              <Plus className="w-4 h-4 mr-1.5" />
              Add Icon
            </Button>
          }
        />
      )}

      <DialogContent className="w-[95vw] sm:max-w-md overflow-x-hidden p-4 sm:p-6 rounded-2xl">
        <DialogHeader className="mb-2">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg font-bold">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            {isEditing ? "Edit System Icon" : "Create New System Icon"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Live Icon Preview & Name Selector */}
          <div className="space-y-2 p-3 rounded-xl bg-muted/40 border">
            <Label className="text-xs font-semibold text-muted-foreground">Icon Preview & Component</Label>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0 shadow-2xs">
                <DynamicLucideIcon name={name} className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-mono text-sm font-bold text-foreground truncate">{name}</div>
                <div className="text-[11px] text-muted-foreground">
                  {isEditing ? "Lucide component key (fixed)" : "Select icon from catalog below"}
                </div>
              </div>
            </div>

            {!isEditing && (
              <div className="mt-3 space-y-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                  <Input
                    placeholder="Search Lucide icons (e.g. Wallet, Heart, Car)..."
                    value={iconSearch}
                    onChange={(e) => setIconSearch(e.target.value)}
                    className="pl-8 h-8 text-xs"
                  />
                </div>
                <div className="grid grid-cols-6 gap-1.5 max-h-36 overflow-y-auto custom-scrollbar p-1 bg-background/80 rounded-lg border">
                  {filteredIconNames.map((icName) => {
                    const isSelected = name === icName;
                    const IconComp = getLucideIcon(icName);
                    return (
                      <button
                        key={icName}
                        type="button"
                        onClick={() => {
                          setName(icName);
                          if (!label) {
                            // Auto populate readable label from PascalCase
                            setLabel(icName.replace(/([A-Z])/g, " $1").trim());
                          }
                        }}
                        className={`p-2 rounded-lg flex flex-col items-center justify-center transition-all ${
                          isSelected
                            ? "bg-primary text-primary-foreground shadow-xs scale-105"
                            : "hover:bg-muted text-muted-foreground hover:text-foreground"
                        }`}
                        title={icName}
                      >
                        <IconComp className="w-4 h-4" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Display Label */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Display Label</Label>
            <Input
              placeholder="e.g. Dining & Restaurants"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="h-9 text-xs sm:text-sm"
              required
            />
          </div>

          {/* Category Selector */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <FolderTree className="w-3.5 h-3.5 text-muted-foreground" /> Category
            </Label>
            <Select
              className="w-full h-9 text-xs sm:text-sm"
              value={category}
              onChange={(val) => setCategory(val)}
              options={CATEGORIES.map((c) => ({ label: c, value: c }))}
            />
          </div>

          {/* Search Tags */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-muted-foreground" /> Search Tags (comma-separated)
            </Label>
            <Input
              placeholder="e.g. food, dinner, zomato, cafe"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="h-9 text-xs"
            />
            <p className="text-[10px] text-muted-foreground">
              Helps users quickly find this icon when searching in form dropdowns.
            </p>
          </div>

          {/* Active Status Switch */}
          <div className="flex items-center justify-between p-3 rounded-xl border bg-muted/20">
            <div>
              <div className="text-xs sm:text-sm font-semibold text-foreground">Active Status</div>
              <div className="text-[11px] text-muted-foreground">
                When active, this icon appears in user form pickers.
              </div>
            </div>
            <Switch checked={isActive} onChange={setIsActive} />
          </div>

          <DialogFooter className="pt-2 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
              className="h-9 text-xs"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="h-9 text-xs font-semibold">
              {loading ? "Saving..." : isEditing ? "Update Icon" : "Create Icon"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
