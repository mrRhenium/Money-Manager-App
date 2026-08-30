"use client";

import React, { useState, useEffect } from "react";
import { getUpiAppsConfig, updateUpiAppsConfig } from "@/actions/user";
import { useToast } from "@/hooks/useToast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Smartphone, 
  Search, 
  RotateCcw, 
  Loader2, 
  Star, 
  Check, 
  ShieldCheck
} from "lucide-react";
import { ALL_UPI_APPS, DEFAULT_ACTIVE_APP_IDS } from "@/lib/upiApps";
import { UpiAppLogo } from "@/components/upi/UpiAppLogo";

interface PaymentAppsSettingsProps {
  noBorder?: boolean;
}

export function PaymentAppsSettings({ noBorder = false }: PaymentAppsSettingsProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [apps, setApps] = useState<any[]>([]);
  const [defaultApp, setDefaultApp] = useState<string>("default");
  const [searchQuery, setSearchQuery] = useState("");

  const loadConfig = async () => {
    try {
      setLoading(true);
      const res = await getUpiAppsConfig();
      setApps(res.apps);
      setDefaultApp(res.defaultUpiApp);
    } catch (err: any) {
      toast.error(err.message || "Failed to load payment apps");
    } finally {
      setLoading(false);
    }
  };

  // Load config on mount
  useEffect(() => {
    loadConfig();
  }, []);

  const handleToggleActive = (appId: string) => {
    setApps(prev => prev.map(app => {
      if (app.id === appId) {
        const newActive = !app.isActive;
        // If turning off default app, reset default to "default"
        if (!newActive && defaultApp === appId) {
          setDefaultApp("default");
        }
        return { ...app, isActive: newActive };
      }
      return app;
    }));
  };

  const handleSetDefault = (appId: string) => {
    // Automatically ensure the default app is active
    setApps(prev => prev.map(app => {
      if (app.id === appId) {
        return { ...app, isActive: true };
      }
      return app;
    }));
    setDefaultApp(appId);
    toast.success(`Set as default UPI app for Scan & Pay!`);
  };

  const handleResetDefaults = () => {
    setApps(ALL_UPI_APPS.map(app => ({
      ...app,
      isActive: DEFAULT_ACTIVE_APP_IDS.includes(app.id),
      isDefault: app.id === "default",
    })));
    setDefaultApp("default");
    toast.info("Reset to recommended default UPI apps. Click 'Save Changes' to apply.");
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const appConfigs = apps.map(a => ({
        appId: a.id,
        isActive: !!a.isActive,
      }));

      await updateUpiAppsConfig({
        apps: appConfigs,
        defaultUpiApp: defaultApp,
      });

      toast.success("Payment apps preferences updated successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save payment apps preferences");
    } finally {
      setSaving(false);
    }
  };

  const filteredApps = apps
    .filter(app => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return app.name.toLowerCase().includes(q) || app.shortName.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      const aActive = a.isActive !== false;
      const bActive = b.isActive !== false;
      if (aActive && !bActive) return -1;
      if (!aActive && bActive) return 1;
      if (a.id === defaultApp) return -1;
      if (b.id === defaultApp) return 1;
      return 0;
    });

  const activeCount = apps.filter(a => a.isActive).length;
  const totalCount = apps.length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 gap-3 text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span className="text-sm">Loading payment apps...</span>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${noBorder ? "" : "p-0"}`}>
      {/* Information Banner */}
      <div className="p-3 rounded-xl bg-primary/5 border border-primary/10 flex items-start gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div className="text-[11px] text-muted-foreground leading-relaxed">
          <p className="font-semibold text-foreground text-xs sm:text-sm mb-0.5">UPI & Payment Apps Manager</p>
          Mark which payment apps you use on your phone. Active apps will appear at the top in <span className="font-semibold text-foreground">Scan & Pay</span> with green <span className="text-emerald-600 font-semibold">Active</span> badges.
        </div>
      </div>

      {/* Summary Stats & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            {activeCount} of {totalCount} Active
          </span>
          <span className="text-xs text-muted-foreground">
            Default: <strong className="text-foreground">{apps.find(a => a.id === defaultApp)?.shortName || "System Chooser"}</strong>
          </span>
        </div>

        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-muted-foreground" />
          <Input 
            placeholder="Search payment apps..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>
      </div>

      {/* App List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {filteredApps.map((app) => {
          const isDef = defaultApp === app.id;
          return (
            <div 
              key={app.id}
              className={`p-2.5 sm:p-3 rounded-xl border transition-all flex items-center justify-between gap-2.5 ${
                app.isActive 
                  ? "bg-card border-border/80 shadow-2xs" 
                  : "bg-muted/30 border-dashed border-border/60 opacity-75 hover:opacity-100"
              }`}
            >
              {/* App Icon / Logo & Info */}
              <div className="flex items-center gap-2.5 min-w-0">
                <UpiAppLogo appId={app.id} size="md" />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs sm:text-sm font-semibold text-foreground truncate">{app.name}</h4>
                    {isDef && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-0.5 shrink-0">
                        <Star className="w-2.5 h-2.5 fill-amber-500" /> Default
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[10px] font-semibold flex items-center gap-1 ${
                      app.isActive ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${app.isActive ? "bg-emerald-500" : "bg-muted-foreground/40"}`} />
                      {app.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Make Default Button */}
                <button
                  type="button"
                  onClick={() => handleSetDefault(app.id)}
                  title={isDef ? "Current Default App" : "Set as Default App"}
                  className={`p-1 rounded-md transition-colors text-xs flex items-center gap-1 ${
                    isDef 
                      ? "text-amber-500 bg-amber-500/10 font-bold" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <Star className={`w-3.5 h-3.5 ${isDef ? "fill-amber-500 text-amber-500" : ""}`} />
                </button>

                {/* Active Toggle Switch */}
                <button
                  type="button"
                  onClick={() => handleToggleActive(app.id)}
                  className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    app.isActive ? "bg-emerald-500" : "bg-muted-foreground/30"
                  }`}
                  title={app.isActive ? "Click to mark as Inactive" : "Click to mark as Active"}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-xs transition-transform ${
                      app.isActive ? "translate-x-5" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredApps.length === 0 && (
        <div className="p-8 text-center border rounded-xl border-dashed text-muted-foreground text-xs">
          No payment apps match &quot;{searchQuery}&quot;.
        </div>
      )}

      {/* Footer Actions */}
      <div className="pt-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleResetDefaults}
          className="text-xs w-full sm:w-auto"
        >
          <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
          Reset Recommended Defaults
        </Button>

        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="text-xs font-bold w-full sm:w-auto"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Check className="w-3.5 h-3.5 mr-1.5" />}
          {saving ? "Saving..." : "Save Preferences"}
        </Button>
      </div>
    </div>
  );
}
