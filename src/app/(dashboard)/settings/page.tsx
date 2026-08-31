"use client";

import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody } from "@/components/ui/dialog";
import { LogOut, User, Bell, Palette, Globe, Smartphone } from "lucide-react";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { subscribeUser, sendTestNotification } from "@/actions/push";
import { getUserProfile, updateProfile, updateThemeColor, updateCurrency, deleteProfilePicture } from "@/actions/user";
import { uploadImageToCloudinary } from "@/lib/cloudinary";
import { Select } from "antd";
import { TimezonePicker } from "@/components/settings/TimezonePicker";
import { PaymentAppsSettings } from "@/components/settings/PaymentAppsSettings";
import { useToast } from "@/hooks/useToast";
import { Plus, Trash, UploadCloud, Loader2, Copy, ChevronRight } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { getAllCurrencies } from "@/actions/currency";
import { MasterLayout } from "@/components/layout/MasterLayout";
import { MasterHeader } from "@/components/layout/MasterHeader";
import { MasterToolbar, MasterViewLayout } from "@/components/layout/MasterView";
import { Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { ConfirmDeleteDialog } from "@/components/common/ConfirmDeleteDialog";
import { TYPOGRAPHY } from "@/lib/designTokens";
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY as string;

const SETTINGS_NAV_ITEMS = [
  { id: "profile", label: "Profile Information", desc: "Update your account details", icon: User, color: "text-primary", bg: "bg-primary/10" },
  { id: "preferences", label: "App Theme", desc: "App theme & appearance", icon: Palette, color: "text-indigo-500", bg: "bg-indigo-500/10" },
  { id: "payment_apps", label: "UPI & Payment Apps", desc: "Manage active apps and default", icon: Smartphone, color: "text-amber-500", bg: "bg-amber-500/10" },
  { id: "timezone", label: "Global Timezone", desc: "Set default times for tracking", icon: Globe, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { id: "notifications", label: "Notifications", desc: "Push alerts and reminders", icon: Bell, color: "text-blue-500", bg: "bg-blue-500/10" },
  { id: "logout", label: "Sign Out", desc: "End your current session", icon: LogOut, color: "text-red-500", bg: "bg-red-500/10" },
] as const;

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function SettingsContent() {
  const { data: session, update: updateSession } = useSession();
  const { toast } = useToast();
  const [isSubscribed, setIsSubscribed] = useState(false);

  const [name, setName] = useState(session?.user?.name || "");
  const [mobile, setMobile] = useState("");
  const [image, setImage] = useState<string>("");
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const [themeColor, setThemeColor] = useState((session?.user as any)?.themeColor || "#0ea5e9");
  const [currency, setCurrency] = useState((session?.user as any)?.currency || "INR");
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [showDeleteAvatarConfirm, setShowDeleteAvatarConfirm] = useState(false);
  const [isThemeLoading, setIsThemeLoading] = useState(false);
  const [isCurrencyLoading, setIsCurrencyLoading] = useState(false);
  const [currencyOptions, setCurrencyOptions] = useState<{ label: string, value: string }[]>([
    { label: 'Indian Rupee (INR)', value: 'INR' },
    { label: 'US Dollar (USD)', value: 'USD' },
  ]);

  useEffect(() => {
    async function loadCurrencies() {
      try {
        setIsCurrencyLoading(true);
        const data = await getAllCurrencies(true);
        if (data.length > 0) {
          setCurrencyOptions(data.map((c: any) => ({
            label: `${c.symbol} (${c.code}) - ${c.name}`,
            value: c.code
          })));
        }
      } catch {
        // fallback to default
      } finally {
        setIsCurrencyLoading(false);
      }
    }
    loadCurrencies();
  }, []);

  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") as "profile" | "preferences" | "payment_apps" | "timezone" | "notifications" | "logout" | null;
  const activeTab = tabParam || "profile";

  const [fontSizePreference, setFontSizePreference] = useState<string>("compact");
  const [fontFamilyPreference, setFontFamilyPreference] = useState<string>("noto");

  useEffect(() => {
    try {
      const savedSize = localStorage.getItem("user-font-size") || "compact";
      setFontSizePreference(savedSize);
      document.documentElement.style.removeProperty("--font-scale");
      document.documentElement.setAttribute("data-font-size", savedSize);
      const savedFamily = localStorage.getItem("user-font-family-key") || "noto";
      setFontFamilyPreference(savedFamily);
    } catch {}
  }, []);

  const handleFontSizeChange = (size: "compact" | "normal" | "large") => {
    setFontSizePreference(size);
    document.documentElement.style.removeProperty("--font-scale");
    document.documentElement.setAttribute("data-font-size", size);
    localStorage.setItem("user-font-size", size);
    toast.success(`Text size set to ${size === "compact" ? "Compact" : size === "large" ? "Comfortable" : "Standard"}`);
  };

  const handleFontFamilyChange = (key: string, familyCss: string) => {
    setFontFamilyPreference(key);
    document.documentElement.style.setProperty("--font-family-base", familyCss);
    localStorage.setItem("user-font-family-key", key);
    localStorage.setItem("user-font-family", familyCss);
    toast.success("Font family updated!");
  };

  const [isMobile, setIsMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");

  const searchMatch = (tabName: string, keywords: string[]) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return tabName.toLowerCase().includes(q) || keywords.some(k => k.toLowerCase().includes(q));
  };

  const showProfile = searchMatch("Profile Information", ["name", "email", "mobile", "phone", "upi", "vpa", "qr code"]);
  const showPreferences = searchMatch("App Theme", ["preferences", "theme", "color", "appearance"]);
  const showPaymentApps = searchMatch("UPI & Payment Apps", ["upi", "gpay", "google pay", "phonepe", "paytm", "amazon pay", "bhim", "cred", "payment apps", "scan and pay", "active", "apps"]);
  const showTimezone = searchMatch("Global Timezone", ["time", "zone", "utc", "gmt", "region"]);
  const showNotifications = searchMatch("Notifications", ["push", "alerts", "reminders", "test"]);
  const showLogout = searchMatch("Sign Out", ["log out", "logout", "exit", "leave"]);

  const isSearching = searchQuery.trim().length > 0;

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1280);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (isMobile && tabParam) {
      setMobileOpen(true);
    }
  }, [tabParam, isMobile]);

  const handleTabChange = (tab: string) => {
    const params = new URLSearchParams(window.location.search);
    params.set("tab", tab);
    router.push(`${window.location.pathname}?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    if (session?.user?.name) {
      setName(session.user.name);
    }
    if ((session?.user as any)?.themeColor) {
      setThemeColor((session?.user as any)?.themeColor);
    }

    getUserProfile().then(user => {
      if (user.name) setName(user.name);
      if (user.mobile) setMobile(user.mobile);
      if (user.themeColor) setThemeColor(user.themeColor);
      if (user.image) setImage(user.image);
    }).catch(console.error);
  }, [session]);

  // Check actual browser push subscription status on mount
  useEffect(() => {
    async function checkSubscription() {
      try {
        if ("serviceWorker" in navigator && "PushManager" in window) {
          const registration = await navigator.serviceWorker.getRegistration();
          if (registration) {
            const subscription = await registration.pushManager.getSubscription();
            setIsSubscribed(!!subscription);
          } else {
            setIsSubscribed(false);
          }
        }
      } catch {
        // Silently fail if service worker is not available
      }
    }
    checkSubscription();
  }, []);

  const handleThemeColorChange = async (color: string | null) => {
    try {
      setIsThemeLoading(true);
      await updateThemeColor(color);
      await updateSession({ themeColor: color }); // Refresh session data
      if (color) {
        setThemeColor(color);
        toast.success("Theme color saved!");
      } else {
        setThemeColor("#0ea5e9");
        toast.success("Theme reset to default!");
      }
    } catch (error: any) {
      toast.error("Failed to update theme color: " + error.message);
    } finally {
      setIsThemeLoading(false);
    }
  };

  const handleCurrencyChange = (newCurrency: string) => {
    setCurrency(newCurrency);
  };

  const handleProfileSave = async () => {
    try {
      setIsProfileLoading(true);
      await updateProfile({ name, mobile, image });
      await updateCurrency(currency);
      await updateSession({ name, image, currency }); // Refresh session data
      toast.success("Profile updated successfully!");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsProfileLoading(false);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard!`);
    } catch {
      toast.error("Failed to copy to clipboard.");
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    try {
      setIsAvatarUploading(true);
      const url = await uploadImageToCloudinary(file, "money-manager/avatars");
      setImage(url);

      // Auto-save the avatar immediately
      await updateProfile({ name, mobile, image: url });
      await updateSession({ name, image: url });

      toast.success("Profile picture updated successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload Avatar");
    } finally {
      setIsAvatarUploading(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleDeleteAvatar = async () => {
    if (!image) return;
    try {
      setIsAvatarUploading(true);
      await deleteProfilePicture(image);
      setImage("");
      await updateSession({ name, image: "" });
      toast.success("Profile picture removed successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to remove avatar");
    } finally {
      setIsAvatarUploading(false);
    }
  };


  async function handleSubscribe() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      toast.warning("Push notifications are not supported by your browser.");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast.warning("Permission denied by browser.");
        return;
      }

      let registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        try {
          registration = await navigator.serviceWorker.register('/sw.js');
        } catch (e) {
          console.error("SW Registration failed:", e);
        }
      }

      if (!registration) {
        toast.error("Service worker not registered. Please ensure you are not in private browsing mode and using a secure connection (HTTPS).");
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      await subscribeUser(subscription);
      setIsSubscribed(true);
      toast.success("Push notifications enabled successfully!");
    } catch (e: any) {
      toast.error("Failed to subscribe: " + e.message);
    }
  }

  const renderProfileCard = (isMobileView = false) => {
    const content = (
      <div className="space-y-3.5">
        <div className="flex items-center gap-3.5 mb-4">
          <div className="relative w-14 h-14 shrink-0 group">
            <div className="w-full h-full rounded-full bg-secondary flex items-center justify-center text-secondary-foreground text-xl overflow-hidden border">
              {image ? (
                <img src={image} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-7 h-7" />
              )}
              {!image && (
                <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer rounded-full">
                  {isAvatarUploading ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" /> : <UploadCloud className="w-4 h-4 text-white" />}
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={isAvatarUploading} />
                </label>
              )}
            </div>

            {/* Action Badge */}
            {image ? (
              <button
                type="button"
                onClick={() => setShowDeleteAvatarConfirm(true)}
                disabled={isAvatarUploading}
                title="Delete profile picture"
                className="absolute bottom-0 right-0 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md border-2 border-background cursor-pointer hover:scale-110 transition-transform"
              >
                {isAvatarUploading ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Trash className="w-2.5 h-2.5" />}
              </button>
            ) : (
              <label
                title="Upload profile picture"
                className="absolute bottom-0 right-0 w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-md border-2 border-background cursor-pointer hover:scale-110 transition-transform"
              >
                {isAvatarUploading ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Plus className="w-2.5 h-2.5" />}
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={isAvatarUploading} />
              </label>
            )}

            <ConfirmDeleteDialog
              open={showDeleteAvatarConfirm}
              onOpenChange={setShowDeleteAvatarConfirm}
              title="Remove Profile Picture"
              entityName="Profile Picture"
              description="Are you sure you want to remove your profile picture? You can upload a new one at any time."
              confirmText="Remove Picture"
              onConfirm={handleDeleteAvatar}
              isLoading={isAvatarUploading}
            />
          </div>
          <div>
            <p className={cn(TYPOGRAPHY.settingsTitle)}>{session?.user?.name}</p>
            <p className={cn(TYPOGRAPHY.settingsDesc, "mt-0.5")}>{session?.user?.email}</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="name" className={cn(TYPOGRAPHY.settingsLabel)}>Name</Label>
          <Input id="name" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="mobile" className={cn(TYPOGRAPHY.settingsLabel)}>Mobile Phone (Optional)</Label>
          <div className="flex gap-2">
            <Input id="mobile" placeholder="e.g. +1 234 567 8900" value={mobile} onChange={e => setMobile(e.target.value)} />
            <Button type="button" variant="outline" size="icon" className="shrink-0" onClick={() => copyToClipboard(mobile, "Mobile number")} disabled={!mobile}>
              <Copy className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email" className={cn(TYPOGRAPHY.settingsLabel)}>Email</Label>
          <div className="flex gap-2">
            <Input id="email" defaultValue={session?.user?.email || ""} disabled />
            <Button type="button" variant="outline" size="icon" className="shrink-0" onClick={() => copyToClipboard(session?.user?.email || "", "Email")}>
              <Copy className="w-3.5 h-3.5" />
            </Button>
          </div>
          <p className={cn(TYPOGRAPHY.settingsDesc)}>Email cannot be changed.</p>
        </div>
        <div className="space-y-1.5 pt-1">
          <Label className={cn(TYPOGRAPHY.settingsLabel)}>Base Currency</Label>
          <Select
            value={currency}
            onChange={handleCurrencyChange}
            disabled={isCurrencyLoading}
            className="w-full"
            options={currencyOptions}
          />
          <p className={cn(TYPOGRAPHY.settingsDesc)}>This sets the default symbol and formatting everywhere in the app.</p>
        </div>

        <Button className="mt-3 w-full md:w-auto px-4 font-semibold" onClick={handleProfileSave} disabled={isProfileLoading || isAvatarUploading}>
          {isProfileLoading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    );

    if (isMobileView) return content;

    return (
      <Card className="rounded-xl shadow-xs">
        <CardHeader className="p-4 sm:p-5 pb-2 sm:pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <User className="w-4.5 h-4.5 text-primary" />
            </div>
            <div>
              <CardTitle className={cn(TYPOGRAPHY.settingsTitle)}>Profile Information</CardTitle>
              <CardDescription className={cn(TYPOGRAPHY.settingsDesc)}>Update your account details here.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-5 pt-0 sm:pt-0">{content}</CardContent>
      </Card>
    );
  };

  const renderPreferencesCard = (isMobileView = false) => {
    if (isMobileView) {
      return (
        <div className="flex flex-col items-center text-center p-3 sm:p-5 pt-1 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 shadow-xs">
            <Palette className="w-7 h-7" />
          </div>
          <div className="space-y-1.5 max-w-[280px]">
            <h4 className="font-bold text-base text-foreground">App Theme</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Personalize your visual theme and primary accent colors.
            </p>
          </div>

          <div className="w-full space-y-3 pt-1 text-left">
            {/* Primary Accent Color Card */}
            <div className="p-3.5 rounded-xl border bg-card space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-xs sm:text-sm text-foreground">Primary Accent Color</p>
                  <p className="text-[11px] text-muted-foreground">Customize buttons and visual highlights</p>
                </div>
                <div
                  className="w-8 h-8 rounded-full border-2 border-background shadow-xs cursor-pointer overflow-hidden flex-shrink-0 hover:scale-105 transition-transform relative ring-1 ring-border/50"
                  onClick={() => document.getElementById('mobile-theme-color-picker')?.click()}
                  style={{ backgroundColor: themeColor }}
                >
                  <input
                    id="mobile-theme-color-picker"
                    type="color"
                    value={themeColor}
                    onChange={(e) => handleThemeColorChange(e.target.value)}
                    disabled={isThemeLoading}
                    className="opacity-0 w-full h-full cursor-pointer absolute inset-0"
                  />
                </div>
              </div>

              {/* Color Preset Palette */}
              <div className="flex items-center justify-between pt-2 border-t border-border/40">
                <div className="flex items-center gap-2">
                  {[
                    { label: "Sky (Default)", color: "#0ea5e9" },
                    { label: "Violet", color: "#8b5cf6" },
                    { label: "Emerald", color: "#10b981" },
                    { label: "Amber", color: "#f59e0b" },
                    { label: "Rose", color: "#f43f5e" },
                  ].map((preset) => (
                    <button
                      key={preset.color}
                      type="button"
                      onClick={() => handleThemeColorChange(preset.color)}
                      className={cn(
                        "w-6 h-6 rounded-full border border-background shadow-2xs hover:scale-110 transition-transform",
                        themeColor.toLowerCase() === preset.color.toLowerCase() ? "ring-2 ring-primary ring-offset-1" : ""
                      )}
                      style={{ backgroundColor: preset.color }}
                      title={preset.label}
                    />
                  ))}
                </div>
                {themeColor !== "#0ea5e9" && (
                  <button
                    type="button"
                    onClick={() => handleThemeColorChange(null)}
                    disabled={isThemeLoading}
                    className="text-[11px] font-medium text-muted-foreground hover:text-foreground underline transition-colors"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* Text Size / Scaling Card */}
            <div className="p-3.5 rounded-xl border bg-card space-y-2.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-xs sm:text-sm text-foreground">Text Size</p>
                  <p className="text-[11px] text-muted-foreground">Adjust typography scaling across the portal</p>
                </div>
                <span className="text-xs font-bold text-primary capitalize bg-primary/10 px-2 py-0.5 rounded-md">
                  {fontSizePreference === "compact" ? "Compact" : fontSizePreference === "large" ? "Comfortable" : "Standard"}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-muted/50 rounded-xl border">
                {[
                  { key: "compact", label: "Compact", hint: "Dense" },
                  { key: "normal", label: "Standard", hint: "Default" },
                  { key: "large", label: "Comfortable", hint: "Large" },
                ].map(opt => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => handleFontSizeChange(opt.key as any)}
                    className={cn(
                      "py-1.5 px-2 rounded-lg text-xs font-semibold transition-all text-center flex flex-col items-center",
                      fontSizePreference === opt.key 
                        ? "bg-card text-foreground shadow-xs border font-bold" 
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <span>{opt.label}</span>
                    <span className="text-[10px] opacity-70">{opt.hint}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Display Theme Card */}
            <div className="p-3.5 rounded-xl border bg-card flex items-center justify-between shadow-2xs">
              <div>
                <p className="font-semibold text-xs sm:text-sm text-foreground">Display Theme</p>
                <p className="text-[11px] text-muted-foreground">Toggle between light and dark visual themes</p>
              </div>
              <div className="p-0.5 rounded-full bg-background border shadow-2xs">
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>
      );
    }

    const content = (
      <div className="flex flex-col rounded-xl border bg-card shadow-2xs divide-y">

        {/* Portal Theme Color Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 gap-3">
          <div className="flex flex-col">
            <h4 className="text-xs sm:text-sm font-semibold text-foreground">Primary Accent Color</h4>
            <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">Select your favorite color to personalize the portal.</p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <div
              className="w-8 h-8 rounded-full border-2 border-background shadow-sm cursor-pointer overflow-hidden flex-shrink-0 hover:scale-105 transition-transform relative ring-1 ring-border/50"
              onClick={() => document.getElementById('theme-color-picker')?.click()}
              style={{ backgroundColor: themeColor }}
            >
              <input
                id="theme-color-picker"
                type="color"
                value={themeColor}
                onChange={(e) => handleThemeColorChange(e.target.value)}
                disabled={isThemeLoading}
                className="opacity-0 w-full h-full cursor-pointer absolute inset-0"
              />
            </div>
            {themeColor !== "#0ea5e9" && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2.5 text-xs font-medium"
                onClick={() => handleThemeColorChange(null)}
                disabled={isThemeLoading}
              >
                Reset Default
              </Button>
            )}
          </div>
        </div>

        {/* Text Size Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 gap-3">
          <div className="flex flex-col">
            <h4 className="text-xs sm:text-sm font-semibold text-foreground">Text Size & Scaling</h4>
            <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">Scale all cards, headers, badges, and popups simultaneously.</p>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-muted/50 rounded-xl border">
            {[
              { key: "compact", label: "Compact" },
              { key: "normal", label: "Standard" },
              { key: "large", label: "Comfortable" },
            ].map(opt => (
              <button
                key={opt.key}
                type="button"
                onClick={() => handleFontSizeChange(opt.key as any)}
                className={cn(
                  "py-1.5 px-3 rounded-lg text-xs font-semibold transition-all text-center",
                  fontSizePreference === opt.key 
                    ? "bg-card text-foreground shadow-xs border font-bold" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Display Theme Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 gap-3 bg-muted/20">
          <div className="flex flex-col">
            <h4 className="text-xs sm:text-sm font-semibold text-foreground">Dark Mode</h4>
            <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">Toggle between light and dark visual themes.</p>
          </div>
          <div className="self-start sm:self-auto flex items-center justify-center p-0.5 rounded-full bg-background border shadow-2xs">
            <ThemeToggle />
          </div>
        </div>

      </div>
    );

    if (isMobileView) return content;

    return (
      <Card className="rounded-xl shadow-xs">
        <CardHeader className="p-4 sm:p-5 pb-2 sm:pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0">
              <Palette className="w-4.5 h-4.5 text-indigo-500" />
            </div>
            <div>
              <CardTitle className={cn(TYPOGRAPHY.settingsTitle)}>App Theme</CardTitle>
              <CardDescription className={cn(TYPOGRAPHY.settingsDesc)}>Customize your Money Manager appearance.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-5 pt-0 sm:pt-0">{content}</CardContent>
      </Card>
    );
  };

  const renderPaymentAppsCard = (isMobileView = false) => {
    const content = (
      <PaymentAppsSettings noBorder={isMobileView} />
    );

    if (isMobileView) return content;

    return (
      <Card className="rounded-xl shadow-xs">
        <CardHeader className="p-4 sm:p-5 pb-2 sm:pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
              <Smartphone className="w-4.5 h-4.5 text-amber-500" />
            </div>
            <div>
              <CardTitle className={cn(TYPOGRAPHY.settingsTitle)}>UPI & Payment Apps</CardTitle>
              <CardDescription className={cn(TYPOGRAPHY.settingsDesc)}>Select which UPI apps are active on your device and set your default app for Scan & Pay.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-5 pt-0 sm:pt-0">{content}</CardContent>
      </Card>
    );
  };

  const renderTimezoneCard = (isMobileView = false) => {
    const content = (
      <TimezonePicker
        initialTimezone={(session?.user as any)?.timezone || "UTC"}
        noBorder={isMobileView}
        onDone={() => setMobileOpen(false)}
      />
    );

    if (isMobileView) return content;

    return (
      <Card className="rounded-xl shadow-xs">
        <CardHeader className="p-4 sm:p-5 pb-2 sm:pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
              <Globe className="w-4.5 h-4.5 text-emerald-500" />
            </div>
            <div>
              <CardTitle className={cn(TYPOGRAPHY.settingsTitle)}>Global Timezone</CardTitle>
              <CardDescription className={cn(TYPOGRAPHY.settingsDesc)}>All transactions and dates will be displayed according to this timezone.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-5 pt-0 sm:pt-0">{content}</CardContent>
      </Card>
    );
  };

  const renderNotificationsCard = (isMobileView = false) => {
    const content = (
      <div className="space-y-3.5">
        <div className="flex items-center justify-between p-3.5 bg-muted/30 rounded-xl border">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isSubscribed ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'}`}>
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <p className={cn(TYPOGRAPHY.settingsLabel)}>Push Notifications</p>
              <p className={cn(TYPOGRAPHY.settingsDesc, "mt-0.5")}>
                {isSubscribed ? 'You will receive bill reminders and alerts' : 'Enable to receive important reminders'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${isSubscribed ? 'bg-emerald-500/15 text-emerald-600' : 'bg-muted text-muted-foreground'}`}>
              {isSubscribed ? 'Enabled' : 'Disabled'}
            </span>
            <button
              onClick={handleSubscribe}
              disabled={isSubscribed}
              className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${isSubscribed ? 'bg-emerald-500' : 'bg-muted-foreground/30'}`}
            >
              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-xs transition-transform ${isSubscribed ? 'translate-x-5' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>
        {isSubscribed && (
          <div className="flex items-center justify-end">
            <Button onClick={() => sendTestNotification()} variant="secondary" size="sm" className="h-8 px-3 text-xs font-medium">
              <Bell className="w-3.5 h-3.5 mr-1.5" />
              Send Test Notification
            </Button>
          </div>
        )}
      </div>
    );

    if (isMobileView) return content;

    return (
      <Card className="rounded-xl shadow-xs">
        <CardHeader className="p-4 sm:p-5 pb-2 sm:pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
              <Bell className="w-4.5 h-4.5 text-blue-500" />
            </div>
            <div>
              <CardTitle className={cn(TYPOGRAPHY.settingsTitle)}>Notifications</CardTitle>
              <CardDescription className={cn(TYPOGRAPHY.settingsDesc)}>Receive web push notifications for bill reminders and alerts.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-5 pt-0 sm:pt-0">{content}</CardContent>
      </Card>
    );
  };

  const renderLogoutCard = (isMobileView = false, isSearch = false) => {
    if (isMobileView) {
      return (
        <div className="flex flex-col items-center text-center p-3 sm:p-5 pt-1 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 shadow-xs">
            <LogOut className="w-7 h-7" />
          </div>
          <div className="space-y-1.5 max-w-[280px]">
            <h4 className="font-bold text-base text-foreground">Sign out of your account?</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              You will be signed out of your current session on this device. You can sign back in anytime.
            </p>
          </div>
          <div className="w-full flex flex-col gap-2.5 pt-2">
            <Button
              variant="destructive"
              className="w-full h-11 rounded-xl text-sm font-semibold shadow-xs flex items-center justify-center gap-2"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full h-11 rounded-xl text-sm font-medium border-border/70 hover:bg-muted"
              onClick={() => setMobileOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      );
    }

    const rowContent = (
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-3.5 sm:p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
            <LogOut className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <p className="font-semibold text-xs sm:text-sm text-foreground">Sign Out</p>
            <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">Sign out of your account on this device.</p>
          </div>
        </div>
        <Button
          variant="destructive"
          className="w-full sm:w-auto h-9 px-4 text-xs font-semibold rounded-xl"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="w-3.5 h-3.5 mr-1.5" />
          Sign Out
        </Button>
      </div>
    );

    if (isSearch) return rowContent;

    return (
      <Card className="rounded-xl border-red-500/20 shadow-xs">
        <CardContent className="p-0">{rowContent}</CardContent>
      </Card>
    );
  };

  return (
    <MasterLayout>
      <MasterHeader
        title={<div className="flex items-center gap-2"><Settings className="w-6 h-6 text-primary" /> Settings</div>}
        subtitle="Manage your account settings and preferences."
      />

      <div className="flex-1 flex flex-col w-full px-4 lg:px-8 pt-2 sm:pt-4 overflow-hidden">
        <MasterToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search settings..."
          isFilterActive={false} // no filter drawer on settings
          tabs={[]}
          activeTab=""
          onTabChange={() => { }}
        />

        {isSearching ? (
          <MasterViewLayout sidebar={null}>
            <div className="pb-24 pt-1 w-full max-w-4xl space-y-3">
              {showProfile && <div className="bg-card rounded-xl border shadow-xs p-3.5 md:p-5"><h3 className={cn(TYPOGRAPHY.sectionTitle, "mb-3 flex items-center gap-2.5")}><div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><User className="w-3.5 h-3.5 text-primary" /></div> Profile Information</h3>{renderProfileCard(true)}</div>}
              {showPreferences && <div className="bg-card rounded-xl border shadow-xs p-3.5 md:p-5"><h3 className={cn(TYPOGRAPHY.sectionTitle, "mb-3 flex items-center gap-2.5")}><div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0"><Palette className="w-3.5 h-3.5 text-indigo-500" /></div> App Theme</h3>{renderPreferencesCard(true)}</div>}
              {showPaymentApps && <div className="bg-card rounded-xl border shadow-xs p-3.5 md:p-5"><h3 className={cn(TYPOGRAPHY.sectionTitle, "mb-3 flex items-center gap-2.5")}><div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0"><Smartphone className="w-3.5 h-3.5 text-amber-500" /></div> UPI & Payment Apps</h3>{renderPaymentAppsCard(true)}</div>}
              {showTimezone && <div className="bg-card rounded-xl border shadow-xs p-3.5 md:p-5"><h3 className={cn(TYPOGRAPHY.sectionTitle, "mb-3 flex items-center gap-2.5")}><div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0"><Globe className="w-3.5 h-3.5 text-emerald-500" /></div> Global Timezone</h3>{renderTimezoneCard(true)}</div>}
              {showNotifications && <div className="bg-card rounded-xl border shadow-xs p-3.5 md:p-5"><h3 className={cn(TYPOGRAPHY.sectionTitle, "mb-3 flex items-center gap-2.5")}><div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0"><Bell className="w-3.5 h-3.5 text-blue-500" /></div> Notifications</h3>{renderNotificationsCard(true)}</div>}
              {showLogout && <div className="bg-card rounded-xl border shadow-xs p-3.5 md:p-5"><h3 className={cn(TYPOGRAPHY.sectionTitle, "mb-3 flex items-center gap-2.5")}><div className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0"><LogOut className="w-3.5 h-3.5 text-red-500" /></div> Sign Out</h3>{renderLogoutCard(false, true)}</div>}

              {!showProfile && !showPreferences && !showPaymentApps && !showTimezone && !showNotifications && !showLogout && (
                <div className="p-10 text-center text-xs sm:text-sm text-muted-foreground border rounded-xl border-dashed">
                  No settings match your search.
                </div>
              )}
            </div>
          </MasterViewLayout>
        ) : (
          <MasterViewLayout
            sidebar={
              <div className="w-full shrink-0 flex flex-col gap-1.5">
                {SETTINGS_NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id && !isMobile;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabChange(item.id as any)}
                      className={cn(
                        "flex items-center gap-2.5 px-3 py-2.5 font-medium rounded-xl transition-all text-left w-full border text-[length:var(--font-size-settings-label)]",
                        isActive
                          ? "bg-primary text-white border-primary shadow-xs"
                          : "text-muted-foreground bg-card hover:bg-muted border-border/50"
                      )}
                    >
                      <div className={cn(
                        "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                        isActive ? "bg-white/20 text-white" : `${item.bg} ${item.color}`
                      )}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            }
          >
            {isMobile ? (
              <div className="pb-24 pt-1 w-full max-w-4xl flex flex-col gap-2.5">
                {SETTINGS_NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabChange(item.id as any)}
                      className="w-full bg-card border border-slate-200/70 dark:border-slate-800 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between shadow-2xs hover:bg-secondary/50 transition-all text-left group"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105",
                          item.bg
                        )}>
                          <Icon className={cn("w-5 h-5", item.color)} />
                        </div>
                        <div className="min-w-0">
                          <p className={cn(TYPOGRAPHY.cardTitle, "font-semibold leading-snug")}>{item.label}</p>
                          <p className={cn(TYPOGRAPHY.cardSubtitle, "mt-0.5 leading-snug")}>{item.desc}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 ml-2" />
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="pb-24 pt-2 w-full max-w-4xl space-y-4">
                {activeTab === "profile" && renderProfileCard()}
                {activeTab === "preferences" && renderPreferencesCard()}
                {activeTab === "payment_apps" && renderPaymentAppsCard()}
                {activeTab === "timezone" && renderTimezoneCard()}
                {activeTab === "notifications" && renderNotificationsCard()}
                {activeTab === "logout" && renderLogoutCard()}
              </div>
            )}
          </MasterViewLayout>
        )}

        {/* Mobile Dialog Popup */}
        <Dialog open={mobileOpen} onOpenChange={(open) => {
          setMobileOpen(open);
          if (!open) {
            // Clear query param so tab resets
            const params = new URLSearchParams(window.location.search);
            params.delete("tab");
            router.push(window.location.pathname, { scroll: false });
          }
        }}>
          <DialogContent
            initialFocus={false}
            size={["logout", "timezone", "preferences"].includes(activeTab) ? "sm" : "md"}
          >
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {activeTab === "profile" && <><div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><User className="w-3.5 h-3.5 text-primary" /></div> Profile Information</>}
                {activeTab === "preferences" && <><div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0"><Palette className="w-3.5 h-3.5 text-indigo-500" /></div> App Theme</>}
                {activeTab === "payment_apps" && <><div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0"><Smartphone className="w-3.5 h-3.5 text-amber-500" /></div> UPI & Payment Apps</>}
                {activeTab === "timezone" && <><div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0"><Globe className="w-3.5 h-3.5 text-emerald-500" /></div> Global Timezone</>}
                {activeTab === "notifications" && <><div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0"><Bell className="w-3.5 h-3.5 text-blue-500" /></div> Notifications</>}
                {activeTab === "logout" && <><div className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0"><LogOut className="w-3.5 h-3.5 text-red-500" /></div> Sign Out</>}
              </DialogTitle>
              <DialogDescription className="sr-only">
                Settings Configuration
              </DialogDescription>
            </DialogHeader>
            <DialogBody className="pt-1">
              {activeTab === "profile" && renderProfileCard(true)}
              {activeTab === "preferences" && renderPreferencesCard(true)}
              {activeTab === "payment_apps" && renderPaymentAppsCard(true)}
              {activeTab === "timezone" && renderTimezoneCard(true)}
              {activeTab === "notifications" && renderNotificationsCard(true)}
              {activeTab === "logout" && renderLogoutCard(true)}
            </DialogBody>
          </DialogContent>
        </Dialog>
      </div>
    </MasterLayout>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-muted-foreground">Loading settings...</div>}>
      <SettingsContent />
    </Suspense>
  );
}
