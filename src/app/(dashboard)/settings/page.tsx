"use client";

import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { Plus, Trash, UploadCloud, Loader2, Search, Download, Copy, PenLine, ChevronRight } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { ThemeToggle } from "@/components/theme-toggle";
import { getAllCurrencies } from "@/actions/currency";
import { MasterLayout } from "@/components/layout/MasterLayout";
import { MasterHeader } from "@/components/layout/MasterHeader";
import { MasterToolbar, MasterViewLayout } from "@/components/layout/MasterView";
import { Settings } from "lucide-react";
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY as string;

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
  const [isThemeLoading, setIsThemeLoading] = useState(false);
  const [isCurrencyLoading, setIsCurrencyLoading] = useState(false);
  const [currencyOptions, setCurrencyOptions] = useState<{ label: string, value: string }[]>([
    { label: 'Indian Rupee (INR)', value: 'INR' },
    { label: 'US Dollar (USD)', value: 'USD' },
  ]);

  useEffect(() => {
    async function loadCurrencies() {
      try {
        const data = await getAllCurrencies(true);
        if (data.length > 0) {
          setCurrencyOptions(data.map((c: any) => ({
            label: `${c.symbol} (${c.code}) - ${c.name}`,
            value: c.code
          })));
        }
      } catch (err) {
        // fallback to default
      }
    }
    loadCurrencies();
  }, []);

  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") as "profile" | "preferences" | "payment_apps" | "timezone" | "notifications" | "logout" | null;
  const activeTab = tabParam || "profile";

  const [isMobile, setIsMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");

  const searchMatch = (tabName: string, keywords: string[]) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return tabName.toLowerCase().includes(q) || keywords.some(k => k.toLowerCase().includes(q));
  };

  const showProfile = searchMatch("Profile Information", ["name", "email", "mobile", "phone", "upi", "vpa", "qr code"]);
  const showPreferences = searchMatch("Preferences", ["theme", "color", "appearance"]);
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
    } catch (err) {
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
                onClick={handleDeleteAvatar}
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
          </div>
          <div>
            <p className="font-semibold text-sm sm:text-base text-foreground">{session?.user?.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{session?.user?.email}</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-xs font-semibold">Name</Label>
          <Input id="name" className="h-9 text-xs sm:text-sm" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="mobile" className="text-xs font-semibold">Mobile Phone (Optional)</Label>
          <div className="flex gap-2">
            <Input id="mobile" className="h-9 text-xs sm:text-sm" placeholder="e.g. +1 234 567 8900" value={mobile} onChange={e => setMobile(e.target.value)} />
            <Button type="button" variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={() => copyToClipboard(mobile, "Mobile number")} disabled={!mobile}>
              <Copy className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs font-semibold">Email</Label>
          <div className="flex gap-2">
            <Input id="email" className="h-9 text-xs sm:text-sm" defaultValue={session?.user?.email || ""} disabled />
            <Button type="button" variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={() => copyToClipboard(session?.user?.email || "", "Email")}>
              <Copy className="w-3.5 h-3.5" />
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">Email cannot be changed.</p>
        </div>
        <div className="space-y-1.5 pt-1">
          <Label className="text-xs font-semibold">Base Currency</Label>
          <Select
            value={currency}
            onChange={handleCurrencyChange}
            disabled={isCurrencyLoading}
            className="w-full h-9 text-xs"
            options={currencyOptions}
          />
          <p className="text-[11px] text-muted-foreground">This sets the default symbol and formatting everywhere in the app.</p>
        </div>

        <Button className="mt-3 w-full md:w-auto h-9 px-4 text-xs font-semibold" onClick={handleProfileSave} disabled={isProfileLoading || isAvatarUploading}>
          {isProfileLoading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    );

    if (isMobileView) return content;

    return (
      <Card className="rounded-xl shadow-xs">
        <CardHeader className="p-4 sm:p-5 pb-2 sm:pb-3">
          <CardTitle className="text-base font-bold">Profile Information</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">Update your account details here.</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-5 pt-0 sm:pt-0">{content}</CardContent>
      </Card>
    );
  };

  const renderPreferencesCard = (isMobileView = false) => {
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
          <CardTitle className="text-base font-bold">Preferences</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">Customize your Money Manager experience.</CardDescription>
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
          <CardTitle className="text-base font-bold">UPI & Payment Apps</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">Select which UPI apps are active on your device and set your default app for Scan & Pay.</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-5 pt-0 sm:pt-0">{content}</CardContent>
      </Card>
    );
  };

  const renderTimezoneCard = (isMobileView = false) => {
    const content = (
      <TimezonePicker initialTimezone={(session?.user as any)?.timezone || "UTC"} noBorder={isMobileView} />
    );

    if (isMobileView) return content;

    return (
      <Card className="rounded-xl shadow-xs">
        <CardHeader className="p-4 sm:p-5 pb-2 sm:pb-3">
          <CardTitle className="text-base font-bold">Global Timezone</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">All transactions and dates will be displayed according to this timezone.</CardDescription>
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
              <p className="font-semibold text-xs sm:text-sm text-foreground">Push Notifications</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
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
          <CardTitle className="text-base font-bold">Notifications</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">Receive web push notifications for bill reminders and alerts.</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-5 pt-0 sm:pt-0">{content}</CardContent>
      </Card>
    );
  };

  const renderLogoutCard = (isMobileView = false) => {
    const content = (
      <div className="flex items-center justify-between p-3.5">
        <div>
          <p className="font-semibold text-xs sm:text-sm text-foreground">Sign Out</p>
          <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">Sign out of your account on this device.</p>
        </div>
        <Button variant="destructive" size="sm" className="h-8 px-3 text-xs font-semibold" onClick={() => signOut({ callbackUrl: "/login" })}>
          <LogOut className="w-3.5 h-3.5 mr-1.5" />
          Sign Out
        </Button>
      </div>
    );

    if (isMobileView) return content;

    return (
      <Card className="rounded-xl border-red-500/20 shadow-xs">
        <CardContent className="p-0">{content}</CardContent>
      </Card>
    );
  };

  return (
    <MasterLayout>
      <MasterHeader
        title={<><Settings className="w-6 h-6 text-primary" /> Settings</>}
        subtitle="Manage your account settings and preferences."
      />

      <div className="flex-1 flex flex-col w-full px-4 lg:px-8 pt-4 overflow-hidden">
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
            <div className="pb-24 pt-2 w-full max-w-4xl space-y-4">
              {showProfile && <div className="bg-card rounded-xl border shadow-xs p-3.5 md:p-5"><h3 className="text-sm sm:text-base font-bold mb-3">Profile Information</h3>{renderProfileCard(isMobile)}</div>}
              {showPreferences && <div className="bg-card rounded-xl border shadow-xs p-3.5 md:p-5"><h3 className="text-sm sm:text-base font-bold mb-3">Preferences</h3>{renderPreferencesCard(isMobile)}</div>}
              {showPaymentApps && <div className="bg-card rounded-xl border shadow-xs p-3.5 md:p-5"><h3 className="text-sm sm:text-base font-bold mb-3">UPI & Payment Apps</h3>{renderPaymentAppsCard(isMobile)}</div>}
              {showTimezone && <div className="bg-card rounded-xl border shadow-xs p-3.5 md:p-5"><h3 className="text-sm sm:text-base font-bold mb-3">Global Timezone</h3>{renderTimezoneCard(isMobile)}</div>}
              {showNotifications && <div className="bg-card rounded-xl border shadow-xs p-3.5 md:p-5"><h3 className="text-sm sm:text-base font-bold mb-3">Notifications</h3>{renderNotificationsCard(isMobile)}</div>}
              {showLogout && <div className="bg-card rounded-xl border shadow-xs p-3.5 md:p-5"><h3 className="text-sm sm:text-base font-bold mb-3">Sign Out</h3>{renderLogoutCard(isMobile)}</div>}

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
                <button
                  onClick={() => handleTabChange("profile")}
                  className={`flex items-center gap-2.5 px-3 py-2.5 text-xs sm:text-sm font-medium rounded-xl transition-all text-left w-full border ${activeTab === "profile" && !isMobile
                    ? "bg-primary text-white border-primary shadow-xs"
                    : "text-muted-foreground bg-card hover:bg-muted border-border/50"
                    }`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${activeTab === "profile" && !isMobile ? "bg-white/20 text-white" : "bg-primary/10 text-primary"}`}>
                    <User className="w-3.5 h-3.5" />
                  </div>
                  Profile Information
                </button>
                <button
                  onClick={() => handleTabChange("preferences")}
                  className={`flex items-center gap-2.5 px-3 py-2.5 text-xs sm:text-sm font-medium rounded-xl transition-all text-left w-full border ${activeTab === "preferences" && !isMobile
                    ? "bg-primary text-white border-primary shadow-xs"
                    : "text-muted-foreground bg-card hover:bg-muted border-border/50"
                    }`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${activeTab === "preferences" && !isMobile ? "bg-white/20 text-white" : "bg-indigo-500/10 text-indigo-500"}`}>
                    <Palette className="w-3.5 h-3.5" />
                  </div>
                  Preferences
                </button>
                <button
                  onClick={() => handleTabChange("payment_apps")}
                  className={`flex items-center gap-2.5 px-3 py-2.5 text-xs sm:text-sm font-medium rounded-xl transition-all text-left w-full border ${activeTab === "payment_apps" && !isMobile
                    ? "bg-primary text-white border-primary shadow-xs"
                    : "text-muted-foreground bg-card hover:bg-muted border-border/50"
                    }`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${activeTab === "payment_apps" && !isMobile ? "bg-white/20 text-white" : "bg-amber-500/10 text-amber-500"}`}>
                    <Smartphone className="w-3.5 h-3.5" />
                  </div>
                  Payment Apps
                </button>
                <button
                  onClick={() => handleTabChange("timezone")}
                  className={`flex items-center gap-2.5 px-3 py-2.5 text-xs sm:text-sm font-medium rounded-xl transition-all text-left w-full border ${activeTab === "timezone" && !isMobile
                    ? "bg-primary text-white border-primary shadow-xs"
                    : "text-muted-foreground bg-card hover:bg-muted border-border/50"
                    }`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${activeTab === "timezone" && !isMobile ? "bg-white/20 text-white" : "bg-emerald-500/10 text-emerald-500"}`}>
                    <Globe className="w-3.5 h-3.5" />
                  </div>
                  Global Timezone
                </button>
                <button
                  onClick={() => handleTabChange("notifications")}
                  className={`flex items-center gap-2.5 px-3 py-2.5 text-xs sm:text-sm font-medium rounded-xl transition-all text-left w-full border ${activeTab === "notifications" && !isMobile
                    ? "bg-primary text-white border-primary shadow-xs"
                    : "text-muted-foreground bg-card hover:bg-muted border-border/50"
                    }`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${activeTab === "notifications" && !isMobile ? "bg-white/20 text-white" : "bg-blue-500/10 text-blue-500"}`}>
                    <Bell className="w-3.5 h-3.5" />
                  </div>
                  Notifications
                </button>
                <button
                  onClick={() => handleTabChange("logout")}
                  className={`flex items-center gap-2.5 px-3 py-2.5 text-xs sm:text-sm font-medium rounded-xl transition-all text-left w-full border ${activeTab === "logout" && !isMobile
                    ? "bg-primary text-white border-primary shadow-xs"
                    : "text-muted-foreground bg-card hover:bg-muted border-border/50"
                    }`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${activeTab === "logout" && !isMobile ? "bg-white/20 text-white" : "bg-red-500/10 text-red-500"}`}>
                    <LogOut className="w-3.5 h-3.5" />
                  </div>
                  Sign Out
                </button>
              </div>
            }
          >
            {isMobile ? (
              <div className="pb-24 pt-2 w-full max-w-4xl flex flex-col gap-2.5">
                <button onClick={() => handleTabChange("profile")} className="w-full bg-card border rounded-xl p-3 flex items-center justify-between shadow-2xs hover:bg-secondary/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                      <User className="w-4.5 h-4.5 text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-xs sm:text-sm text-foreground">Profile Information</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Update your account details</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>

                <button onClick={() => handleTabChange("preferences")} className="w-full bg-card border rounded-xl p-3 flex items-center justify-between shadow-2xs hover:bg-secondary/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                      <Palette className="w-4.5 h-4.5 text-indigo-500" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-xs sm:text-sm text-foreground">Preferences</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">App theme & appearance</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>

                <button onClick={() => handleTabChange("payment_apps")} className="w-full bg-card border rounded-xl p-3 flex items-center justify-between shadow-2xs hover:bg-secondary/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
                      <Smartphone className="w-4.5 h-4.5 text-amber-500" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-xs sm:text-sm text-foreground">UPI & Payment Apps</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Manage active apps and default</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>

                <button onClick={() => handleTabChange("timezone")} className="w-full bg-card border rounded-xl p-3 flex items-center justify-between shadow-2xs hover:bg-secondary/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                      <Globe className="w-4.5 h-4.5 text-emerald-500" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-xs sm:text-sm text-foreground">Global Timezone</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Set default times for tracking</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>

                <button onClick={() => handleTabChange("notifications")} className="w-full bg-card border rounded-xl p-3 flex items-center justify-between shadow-2xs hover:bg-secondary/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
                      <Bell className="w-4.5 h-4.5 text-blue-500" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-xs sm:text-sm text-foreground">Notifications</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Push alerts and reminders</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>

                <button onClick={() => handleTabChange("logout")} className="w-full bg-card border rounded-xl p-3 flex items-center justify-between shadow-2xs hover:bg-red-500/5 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center">
                      <LogOut className="w-4.5 h-4.5 text-red-500" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-xs sm:text-sm text-foreground">Sign Out</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">End your current session</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
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
            className="w-[95vw] max-w-lg p-5 rounded-2xl max-h-[85vh] overflow-y-auto"
          >
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-foreground">
                {activeTab === "profile" && "Profile Information"}
                {activeTab === "preferences" && "Preferences"}
                {activeTab === "payment_apps" && "UPI & Payment Apps"}
                {activeTab === "timezone" && "Global Timezone"}
                {activeTab === "notifications" && "Notifications"}
                {activeTab === "logout" && "Sign Out"}
              </DialogTitle>
            </DialogHeader>
            <div className="pt-1">
              {activeTab === "profile" && renderProfileCard(true)}
              {activeTab === "preferences" && renderPreferencesCard(true)}
              {activeTab === "payment_apps" && renderPaymentAppsCard(true)}
              {activeTab === "timezone" && renderTimezoneCard(true)}
              {activeTab === "notifications" && renderNotificationsCard(true)}
              {activeTab === "logout" && renderLogoutCard(true)}
            </div>
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
