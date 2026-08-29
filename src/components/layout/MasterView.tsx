import React from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, FilterIcon, XCircle, LayoutGrid, PieChartIcon } from "lucide-react";
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
  return (
    <div className="shrink-0 flex flex-col-reverse lg:flex-row items-stretch lg:items-center justify-between gap-4 pb-4 border-b border-border/50">
      
      {/* Tabs */}
      {tabs.length > 0 ? (
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
      ) : <div />}

      {/* Right Side: Actions & Search */}
      <div className="shrink-0 flex gap-2 w-full lg:w-auto justify-between lg:justify-end">
        {primaryAction && (
          <div className="hidden lg:block">
            {primaryAction}
          </div>
        )}

        <div className="flex lg:hidden gap-2 w-full">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 h-10 bg-card text-foreground focus-visible:ring-0 focus-visible:ring-offset-0 border-slate-200 dark:border-slate-800 shadow-sm"
            />
          </div>
          {onFilterClick && (
            <Button
              variant={isFilterActive ? "default" : "outline"}
              onClick={onFilterClick}
              className={cn(
                "h-10 shrink-0 text-sm shadow-sm",
                !isFilterActive && "bg-card text-foreground hover:bg-card/80 hover:text-foreground border-slate-200 dark:border-slate-800"
              )}
            >
              <FilterIcon className="w-4 h-4 mr-2" />
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
    <div className="flex-1 flex flex-col lg:flex-row gap-4 mt-4 overflow-hidden">
      <div className="flex-1 min-w-0 overflow-y-auto pb-24 custom-scrollbar">
        {children}
      </div>
      {sidebar && (
        <div className="hidden lg:block w-80 shrink-0 overflow-y-auto pb-24 custom-scrollbar pr-1">
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
      <CardHeader className="pb-3 border-b border-border/40 bg-gradient-to-b from-muted/30 to-transparent">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 font-semibold text-lg tracking-tight text-foreground">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <FilterIcon className="w-4 h-4" />
            </div>
            Filters & Sort
          </div>
          {isFilterActive && (
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={onClearFilters} 
              className="h-7 text-xs px-2.5 rounded-full font-medium shadow-sm hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 border border-transparent transition-all"
            >
              <XCircle className="w-3.5 h-3.5 mr-1" /> Clear All
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-5 flex flex-col gap-5">
        {children}
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
      title={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2.5 font-semibold text-lg tracking-tight text-foreground">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <FilterIcon className="w-4 h-4" />
            </div>
            Filters & Sort
          </div>
          {isFilterActive && (
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={onClearFilters} 
              className="h-7 text-xs px-2.5 rounded-full font-medium shadow-sm hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 border border-transparent transition-all"
            >
              <XCircle className="w-3.5 h-3.5 mr-1" /> Clear
            </Button>
          )}
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
        header: { padding: '16px 20px', borderBottom: '1px solid hsl(var(--border-hsl) / 0.4)', background: 'linear-gradient(to bottom, hsl(var(--muted-hsl) / 0.3), transparent)' },
        body: { padding: '20px' } 
      }}
    >
      <div className="flex flex-col gap-5">
        {children}
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
    <div className="space-y-2">
      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-9 h-10 bg-background text-foreground focus-visible:ring-1 focus-visible:ring-primary/50 border-slate-200 dark:border-slate-800 shadow-sm transition-all"
        />
      </div>
    </div>
  );
}
