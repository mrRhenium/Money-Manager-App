import React from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FilterIcon, LayoutGrid, PieChartIcon, X, RotateCcw } from "lucide-react";
import { Drawer } from "antd";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// --- TOOLBAR --- //

interface MasterToolbarProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  onFilterClick?: () => void;
  isFilterActive: boolean;
  searchPlaceholder?: string;
  // Tabs config
  activeTab: string;
  onTabChange: (val: string) => void;
  tabs?: { value: string; label: string; icon: React.ReactNode }[];
  // Actions
  primaryAction?: React.ReactNode;
}

export function MasterToolbar({
  searchQuery,
  onSearchChange,
  onFilterClick,
  isFilterActive,
  searchPlaceholder = "Search...",
  activeTab,
  onTabChange,
  tabs = [
    { value: "data", label: "Data View", icon: <LayoutGrid className="w-4 h-4 mr-2" /> },
    { value: "insights", label: "Insights & Graphs", icon: <PieChartIcon className="w-4 h-4 mr-2" /> }
  ],
  primaryAction
}: MasterToolbarProps) {
  const hasTabs = Boolean(tabs && tabs.length > 0);

  return (
    <div className={cn(
      "shrink-0 flex flex-col-reverse lg:flex-row items-stretch lg:items-center justify-between",
      hasTabs ? "gap-4 pb-4 border-b border-border/50" : "gap-0 pb-2 sm:pb-3 border-b border-border/40"
    )}>

      {/* Tabs */}
      {hasTabs ? (
        <Tabs value={activeTab} onValueChange={onTabChange} className="w-full lg:w-[450px]">
          <TabsList className="w-full h-12 bg-slate-100/80 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 p-1 flex rounded-full shadow-inner">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                onClick={() => onTabChange(tab.value)}
                className={cn(
                  "cursor-pointer flex-1 h-full flex items-center justify-center rounded-full text-sm font-semibold transition-all duration-300 ease-out text-muted-foreground hover:text-foreground",
                  activeTab === tab.value ? "bg-white dark:bg-slate-800 text-foreground shadow-sm" : ""
                )}
              >
                {tab.icon} {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      ) : null}

      {/* Right Side: Actions & Search */}
      <div className={cn("shrink-0 flex gap-2 w-full lg:w-auto justify-between lg:justify-end", !hasTabs && "w-full")}>
        {primaryAction && (
          <div className="hidden lg:block">
            {primaryAction}
          </div>
        )}

        <div className="flex lg:hidden gap-2 w-full">
          <div className="flex-1">
            <Input
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full h-9 text-[length:var(--font-size-filter-input)] px-3 bg-card text-foreground focus-visible:ring-1 focus-visible:ring-primary/50 border-slate-200 dark:border-slate-800 shadow-2xs placeholder:text-[length:var(--font-size-filter-input)] text-left"
            />
          </div>
          {onFilterClick && (
            <Button
              variant="outline"
              onClick={onFilterClick}
              className={cn(
                "h-9 shrink-0 text-[length:var(--font-size-btn-sm)] font-semibold px-3 shadow-2xs rounded-lg transition-colors",
                isFilterActive
                  ? "bg-primary/10 text-primary border-primary/30 hover:bg-primary/20 hover:text-primary"
                  : "bg-card text-foreground hover:bg-card/80 hover:text-foreground border-slate-200 dark:border-slate-800"
              )}
            >
              <FilterIcon className={cn("w-3.5 h-3.5 mr-1.5", isFilterActive ? "text-primary" : "text-muted-foreground")} />
              Advance Filter {isFilterActive && " (Active)"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// --- VIEW LAYOUT (Splits main content and sidebar) --- //

interface MasterViewLayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
}

export function MasterViewLayout({ children, sidebar }: MasterViewLayoutProps) {
  return (
    <div className="flex-1 flex flex-col lg:flex-row gap-4 mt-2 sm:mt-4 overflow-hidden">
      <div className="flex-1 min-w-0 overflow-y-auto pb-24 custom-scrollbar">
        {children}
      </div>
      {sidebar && (
        <div className="hidden lg:block w-80 shrink-0 overflow-y-auto custom-scrollbar">
          {sidebar}
        </div>
      )}
    </div>
  );
}

// --- FILTER SIDEBAR (Desktop) --- //

interface MasterFilterSidebarProps {
  isFilterActive: boolean;
  onClearFilters: () => void;
  children: React.ReactNode;
}

export function MasterFilterSidebar({ isFilterActive, onClearFilters, children }: MasterFilterSidebarProps) {
  return (
    <Card className={cn(
      "shadow-sm bg-card border-slate-200/60 dark:border-slate-800 transition-colors",
      isFilterActive ? "border-primary/50 ring-1 ring-primary/20" : ""
    )}>
      <CardHeader className="py-3 px-4 border-b border-border/40 bg-gradient-to-b from-muted/30 to-transparent">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-sm tracking-tight text-foreground">
            <div className="p-1.5 rounded-md bg-primary/10 text-primary">
              <FilterIcon className="w-4 h-4" />
            </div>
            Filters & Sort
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 flex flex-col gap-4 [&_h3]:text-[length:var(--font-size-filter-label)] [&_h3]:font-semibold [&_h3]:mb-1.5 [&_h3]:tracking-wider [&_label]:text-[length:var(--font-size-filter-label)] [&_label]:font-semibold [&_.ant-select]:text-[length:var(--font-size-filter-input)] [&_.ant-select]:!min-h-[36px] [&_.ant-select]:!flex [&_.ant-select]:!items-center [&_.ant-select-content]:!flex [&_.ant-select-content]:!items-center [&_.ant-select-content]:!leading-normal [&_.ant-select-placeholder]:!flex [&_.ant-select-placeholder]:!items-center [&_.ant-select-suffix]:!flex [&_.ant-select-suffix]:!items-center [&_.ant-select-selector]:!min-h-[36px] [&_.ant-select-selector]:!h-auto [&_.ant-select-selector]:!py-0.5 [&_.ant-select-selection-item]:!text-[length:var(--font-size-filter-input)] [&_.ant-select-selection-placeholder]:!text-[length:var(--font-size-filter-input)] [&_input]:h-9 [&_input]:text-[length:var(--font-size-filter-input)] [&_input]:placeholder:text-[length:var(--font-size-filter-input)]">
        {children}

        {isFilterActive && (
          <div className="pt-2 border-t border-border/50 mt-1">
            <Button
              variant="outline"
              onClick={onClearFilters}
              className="w-full h-9 rounded-xl text-[length:var(--font-size-btn-sm)] font-semibold text-red-600 dark:text-red-400 border-red-500/30 hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-600 transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-red-500" />
              Clear All Filters
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// --- FILTER DRAWER (Mobile) --- //

interface MasterFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  isFilterActive: boolean;
  onClearFilters: () => void;
  children: React.ReactNode;
}

export function MasterFilterDrawer({ isOpen, onClose, isFilterActive, onClearFilters, children }: MasterFilterDrawerProps) {
  return (
    <Drawer
      closable={false}
      extra={
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/80 -mr-1"
        >
          <X className="w-4 h-4" />
        </Button>
      }
      title={
        <div className="flex items-center gap-2 font-semibold text-sm tracking-tight text-foreground">
          <div className="p-1.5 rounded-md bg-primary/10 text-primary">
            <FilterIcon className="w-4 h-4" />
          </div>
          Filters & Sort
        </div>
      }
      placement="right"
      onClose={onClose}
      open={isOpen}
      width={320}
      classNames={{
        body: "bg-card text-foreground",
        header: "bg-card text-foreground border-b dark:border-slate-800",
        content: "bg-card text-foreground border-l dark:border-slate-800"
      }}
      styles={{
        header: { padding: '14px 16px', borderBottom: '1px solid hsl(var(--border-hsl) / 0.4)', background: 'linear-gradient(to bottom, hsl(var(--muted-hsl) / 0.3), transparent)' },
        body: { padding: '16px' }
      }}
    >
      <div className="flex flex-col gap-4 [&_h3]:text-[length:var(--font-size-filter-label)] [&_h3]:font-semibold [&_h3]:mb-1.5 [&_h3]:tracking-wider [&_label]:text-[length:var(--font-size-filter-label)] [&_label]:font-semibold [&_.ant-select]:text-[length:var(--font-size-filter-input)] [&_.ant-select]:!min-h-[36px] [&_.ant-select]:!flex [&_.ant-select]:!items-center [&_.ant-select-content]:!flex [&_.ant-select-content]:!items-center [&_.ant-select-content]:!leading-normal [&_.ant-select-placeholder]:!flex [&_.ant-select-placeholder]:!items-center [&_.ant-select-suffix]:!flex [&_.ant-select-suffix]:!items-center [&_.ant-select-selector]:!min-h-[36px] [&_.ant-select-selector]:!h-auto [&_.ant-select-selector]:!py-0.5 [&_.ant-select-selection-item]:!text-[length:var(--font-size-filter-input)] [&_.ant-select-selection-placeholder]:!text-[length:var(--font-size-filter-input)] [&_input]:h-9 [&_input]:text-[length:var(--font-size-filter-input)] [&_input]:placeholder:text-[length:var(--font-size-filter-input)]">
        {children}

        {isFilterActive && (
          <div className="pt-2 border-t border-border/50 mt-1">
            <Button
              variant="outline"
              onClick={onClearFilters}
              className="w-full h-9 rounded-xl text-[length:var(--font-size-btn-sm)] font-semibold text-red-600 dark:text-red-400 border-red-500/30 hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-600 transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-red-500" />
              Clear All Filters
            </Button>
          </div>
        )}
      </div>
    </Drawer>
  );
}

// --- SEARCH FIELD (Common UI for Advanced Filters) --- //

interface MasterSearchFieldProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  placeholder?: string;
}

export function MasterSearchField({ searchQuery, onSearchChange, placeholder = "Search..." }: MasterSearchFieldProps) {
  return (
    <div className="w-full">
      <Input
        placeholder={placeholder}
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full h-9 text-[length:var(--font-size-filter-input)] px-3 bg-background text-foreground focus-visible:ring-1 focus-visible:ring-primary/50 border-slate-200 dark:border-slate-800 shadow-2xs transition-all placeholder:text-[length:var(--font-size-filter-input)] text-left"
      />
    </div>
  );
}
