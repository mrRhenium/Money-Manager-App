"use client";

import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LogOut, User, Bell, Palette, Globe } from "lucide-react";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { subscribeUser, sendTestNotification } from "@/actions/push";
import { getUserProfile, updateProfile, updateThemeColor, updateCurrency, deleteProfilePicture } from "@/actions/user";
import { uploadImageToCloudinary } from "@/lib/cloudinary";
import { Select } from "antd";
import { TimezonePicker } from "@/components/settings/TimezonePicker";
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
  const [currencyOptions, setCurrencyOptions] = useState<{label: string, value: string}[]>([
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
  const tabParam = searchParams.get("tab") as "profile" | "preferences" | "timezone" | "notifications" | "logout" | null;
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
      <div className="space-y-4">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative w-16 h-16 shrink-0 group">
            <div className="w-full h-full rounded-full bg-secondary flex items-center justify-center text-secondary-foreground text-2xl overflow-hidden border">
              {image ? (
                <img src={image} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-8 h-8" />
              )}
              {!image && (
                <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer rounded-full">
                  {isAvatarUploading ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <UploadCloud className="w-5 h-5 text-white" />}
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
                className="absolute bottom-0 right-0 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md border-2 border-background cursor-pointer hover:scale-110 transition-transform"
              >
                {isAvatarUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash className="w-3 h-3" />}
              </button>
            ) : (
              <label 
                title="Upload profile picture"
                className="absolute bottom-0 right-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-md border-2 border-background cursor-pointer hover:scale-110 transition-transform"
              >
                {isAvatarUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={isAvatarUploading} />
              </label>
            )}
          </div>
          <div>
            <p className="font-medium text-lg">{session?.user?.name}</p>
            <p className="text-sm text-muted-foreground">{session?.user?.email}</p>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="mobile">Mobile Phone (Optional)</Label>
          <div className="flex gap-2">
            <Input id="mobile" placeholder="e.g. +1 234 567 8900" value={mobile} onChange={e => setMobile(e.target.value)} />
            <Button type="button" variant="outline" size="icon" className="shrink-0" onClick={() => copyToClipboard(mobile, "Mobile number")} disabled={!mobile}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="flex gap-2">
            <Input id="email" defaultValue={session?.user?.email || ""} disabled />
            <Button type="button" variant="outline" size="icon" className="shrink-0" onClick={() => copyToClipboard(session?.user?.email || "", "Email")}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
        </div>
        <div className="space-y-2 pt-2">
          <Label>Base Currency</Label>
          <Select 
            value={currency} 
            onChange={handleCurrencyChange} 
            disabled={isCurrencyLoading}
            className="w-full h-10"
            options={currencyOptions}
          />
          <p className="text-xs text-muted-foreground">This sets the default symbol and formatting everywhere in the app.</p>
        </div>

        <Button className="mt-4 w-full md:w-auto" onClick={handleProfileSave} disabled={isProfileLoading || isAvatarUploading}>
          {isProfileLoading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    );

    if (isMobileView) return content;

    return (
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your account details here.</CardDescription>
        </CardHeader>
        <CardContent>{content}</CardContent>
      </Card>
    );
  };

  const renderPreferencesCard = (isMobileView = false) => {
    const content = (
      <div className="space-y-6">
        <div className="space-y-2">
          <Label>Portal Theme Color</Label>
          <div className="flex items-center gap-4">
            <div 
              className="w-10 h-10 rounded-full border shadow-sm cursor-pointer overflow-hidden flex-shrink-0"
              onClick={() => document.getElementById('theme-color-picker')?.click()}
              style={{ backgroundColor: themeColor }}
            >
              <input 
                id="theme-color-picker"
                type="color" 
                value={themeColor} 
                onChange={(e) => handleThemeColorChange(e.target.value)}
                disabled={isThemeLoading}
                className="opacity-0 w-full h-full cursor-pointer"
              />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Primary Color</p>
              <p className="text-xs text-muted-foreground">Select your favorite color to personalize the entire portal.</p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleThemeColorChange(null)}
              disabled={isThemeLoading || themeColor === "#0ea5e9"}
            >
              Reset Default
            </Button>
          </div>
        </div>

        <div className="pt-4 border-t space-y-2 mt-4">
          <Label>Display Theme</Label>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium">Dark Mode</p>
              <p className="text-xs text-muted-foreground">Toggle between light and dark themes.</p>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>
    );

    if (isMobileView) return content;

    return (
      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>Customize your Money Manager experience.</CardDescription>
        </CardHeader>
        <CardContent>{content}</CardContent>
      </Card>
    );
  };

  const renderTimezoneCard = (isMobileView = false) => {
    const content = (
      <TimezonePicker initialTimezone={(session?.user as any)?.timezone || "UTC"} noBorder={isMobileView} />
    );

    if (isMobileView) return content;

    return (
      <Card>
        <CardHeader>
          <CardTitle>Global Timezone</CardTitle>
          <CardDescription>All transactions and dates will be displayed according to this timezone.</CardDescription>
        </CardHeader>
        <CardContent>{content}</CardContent>
      </Card>
    );
  };

  const renderNotificationsCard = (isMobileView = false) => {
    const content = (
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isSubscribed ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'}`}>
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <p className="font-medium text-sm">Push Notifications</p>
              <p className="text-xs text-muted-foreground">
                {isSubscribed ? 'You will receive bill reminders and alerts' : 'Enable to receive important reminders'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${isSubscribed ? 'bg-emerald-500/15 text-emerald-600' : 'bg-muted text-muted-foreground'}`}>
              {isSubscribed ? 'Enabled' : 'Disabled'}
            </span>
            <button
              onClick={handleSubscribe}
              disabled={isSubscribed}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${isSubscribed ? 'bg-emerald-500' : 'bg-muted-foreground/30'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${isSubscribed ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>
        {isSubscribed && (
          <div className="flex items-center justify-end">
            <Button onClick={() => sendTestNotification()} variant="secondary" size="sm">
              <Bell className="w-3.5 h-3.5 mr-1.5" />
              Send Test Notification
            </Button>
          </div>
        )}
      </div>
    );

    if (isMobileView) return content;

    return (
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Receive web push notifications for bill reminders and alerts.</CardDescription>
        </CardHeader>
        <CardContent>{content}</CardContent>
      </Card>
    );
  };

  const renderLogoutCard = (isMobileView = false) => {
    const content = (
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-foreground">Sign Out</p>
          <p className="text-sm text-muted-foreground mt-0.5">Sign out of your account on this device.</p>
        </div>
        <Button variant="destructive" onClick={() => signOut({ callbackUrl: "/login" })}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
        </Button>
      </div>
    );

    if (isMobileView) return content;

    return (
      <Card className="border-red-500/20">
        <CardContent className="p-6">{content}</CardContent>
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
          onTabChange={() => {}}
        />

      {isSearching ? (
        <MasterViewLayout sidebar={null}>
          <div className="pb-24 pt-2 w-full max-w-4xl space-y-6">
            {showProfile && <div className="bg-card rounded-2xl border shadow-sm p-4 md:p-6"><h3 className="text-lg font-bold mb-4">Profile Information</h3>{renderProfileCard(isMobile)}</div>}
            {showPreferences && <div className="bg-card rounded-2xl border shadow-sm p-4 md:p-6"><h3 className="text-lg font-bold mb-4">Preferences</h3>{renderPreferencesCard(isMobile)}</div>}
            {showTimezone && <div className="bg-card rounded-2xl border shadow-sm p-4 md:p-6"><h3 className="text-lg font-bold mb-4">Global Timezone</h3>{renderTimezoneCard(isMobile)}</div>}
            {showNotifications && <div className="bg-card rounded-2xl border shadow-sm p-4 md:p-6"><h3 className="text-lg font-bold mb-4">Notifications</h3>{renderNotificationsCard(isMobile)}</div>}
            {showLogout && <div className="bg-card rounded-2xl border shadow-sm p-4 md:p-6"><h3 className="text-lg font-bold mb-4">Sign Out</h3>{renderLogoutCard(isMobile)}</div>}
            
            {!showProfile && !showPreferences && !showTimezone && !showNotifications && !showLogout && (
              <div className="p-12 text-center text-muted-foreground border rounded-xl border-dashed">
                No settings match your search.
              </div>
            )}
          </div>
        </MasterViewLayout>
      ) : (
        <MasterViewLayout
          sidebar={
            <div className="w-full shrink-0 flex flex-col gap-2">
              <button
                onClick={() => handleTabChange("profile")}
                className={`flex items-center gap-2.5 px-4 py-3.5 text-sm font-semibold rounded-xl transition-all text-left w-full border ${
                  activeTab === "profile" && !isMobile
                    ? "bg-primary text-white border-primary shadow-sm"
                    : "text-muted-foreground bg-card hover:bg-muted border-border/50"
                }`}
              >
                <User className="w-4 h-4" />
                Profile Information
              </button>
              <button
                onClick={() => handleTabChange("preferences")}
                className={`flex items-center gap-2.5 px-4 py-3.5 text-sm font-semibold rounded-xl transition-all text-left w-full border ${
                  activeTab === "preferences" && !isMobile
                    ? "bg-primary text-white border-primary shadow-sm"
                    : "text-muted-foreground bg-card hover:bg-muted border-border/50"
                }`}
              >
                <Palette className="w-4 h-4" />
                Preferences
              </button>
              <button
                onClick={() => handleTabChange("timezone")}
                className={`flex items-center gap-2.5 px-4 py-3.5 text-sm font-semibold rounded-xl transition-all text-left w-full border ${
                  activeTab === "timezone" && !isMobile
                    ? "bg-primary text-white border-primary shadow-sm"
                    : "text-muted-foreground bg-card hover:bg-muted border-border/50"
                }`}
              >
                <Globe className="w-4 h-4" />
                Global Timezone
              </button>
              <button
                onClick={() => handleTabChange("notifications")}
                className={`flex items-center gap-2.5 px-4 py-3.5 text-sm font-semibold rounded-xl transition-all text-left w-full border ${
                  activeTab === "notifications" && !isMobile
                    ? "bg-primary text-white border-primary shadow-sm"
                    : "text-muted-foreground bg-card hover:bg-muted border-border/50"
                }`}
              >
                <Bell className="w-4 h-4" />
                Notifications
              </button>
              <button
                onClick={() => handleTabChange("logout")}
                className={`flex items-center gap-2.5 px-4 py-3.5 text-sm font-semibold rounded-xl transition-all text-left w-full border ${
                  activeTab === "logout" && !isMobile
                    ? "bg-primary text-white border-primary shadow-sm"
                    : "text-muted-foreground bg-card hover:bg-muted border-border/50"
                }`}
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          }
        >
          {isMobile ? (
            <div className="pb-24 pt-2 w-full max-w-4xl flex flex-col gap-3">
              <button onClick={() => handleTabChange("profile")} className="w-full bg-card border rounded-2xl p-4 flex items-center justify-between shadow-sm hover:bg-secondary/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-base text-foreground">Profile Information</p>
                    <p className="text-sm text-muted-foreground">Update your account details</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
              
              <button onClick={() => handleTabChange("preferences")} className="w-full bg-card border rounded-2xl p-4 flex items-center justify-between shadow-sm hover:bg-secondary/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center">
                    <Palette className="w-6 h-6 text-indigo-500" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-base text-foreground">Preferences</p>
                    <p className="text-sm text-muted-foreground">App theme and currency</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>

              <button onClick={() => handleTabChange("timezone")} className="w-full bg-card border rounded-2xl p-4 flex items-center justify-between shadow-sm hover:bg-secondary/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <Globe className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-base text-foreground">Global Timezone</p>
                    <p className="text-sm text-muted-foreground">Set default times for tracking</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>

              <button onClick={() => handleTabChange("notifications")} className="w-full bg-card border rounded-2xl p-4 flex items-center justify-between shadow-sm hover:bg-secondary/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <Bell className="w-6 h-6 text-blue-500" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-base text-foreground">Notifications</p>
                    <p className="text-sm text-muted-foreground">Push alerts and reminders</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>

              <button onClick={() => handleTabChange("logout")} className="w-full bg-card border rounded-2xl p-4 flex items-center justify-between shadow-sm hover:bg-red-500/5 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                    <LogOut className="w-6 h-6 text-red-500" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-base text-foreground">Sign Out</p>
                    <p className="text-sm text-muted-foreground">End your current session</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          ) : (
            <div className="pb-24 pt-2 w-full max-w-4xl space-y-6">
              {activeTab === "profile" && renderProfileCard()}
              {activeTab === "preferences" && renderPreferencesCard()}
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
              {activeTab === "timezone" && "Global Timezone"}
              {activeTab === "notifications" && "Notifications"}
              {activeTab === "logout" && "Sign Out"}
            </DialogTitle>
          </DialogHeader>
          <div className="pt-1">
            {activeTab === "profile" && renderProfileCard(true)}
            {activeTab === "preferences" && renderPreferencesCard(true)}
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
