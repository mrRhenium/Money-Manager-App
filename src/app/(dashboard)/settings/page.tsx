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
import { getUserProfile, updateProfile, updateThemeColor } from "@/actions/user";
import { TimezonePicker } from "@/components/settings/TimezonePicker";
import { useToast } from "@/hooks/useToast";

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
  const [themeColor, setThemeColor] = useState((session?.user as any)?.themeColor || "#0ea5e9");
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isThemeLoading, setIsThemeLoading] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") as "profile" | "preferences" | "timezone" | "notifications" | "logout" | null;
  const activeTab = tabParam || "profile";
  
  const [isMobile, setIsMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
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

  const handleProfileSave = async () => {
    try {
      setIsProfileLoading(true);
      await updateProfile({ name, mobile });
      await updateSession({ name }); // Refresh session data
      toast.success("Profile updated successfully!");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsProfileLoading(false);
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

      // Instead of waiting forever for .ready, let's check if it's registered first
      let registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        toast.error("Service worker not registered. Push notifications are disabled in development mode.");
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
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground text-2xl">
            <User className="w-8 h-8" />
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
          <Input id="mobile" placeholder="e.g. +1 234 567 8900" value={mobile} onChange={e => setMobile(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" defaultValue={session?.user?.email || ""} disabled />
          <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
        </div>
        <Button className="mt-4 w-full md:w-auto" onClick={handleProfileSave} disabled={isProfileLoading}>
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
        
        <div className="space-y-2">
          <Label>Currency</Label>
          <Input value="Dynamic (Multi-Currency Enabled)" disabled />
          <p className="text-xs text-muted-foreground">Log transactions in any currency, auto-converts to INR.</p>
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
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar Navigation (always vertical listing) */}
        <div className="w-full md:w-64 shrink-0 flex flex-col gap-2 md:border-r md:pr-4">
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

        {/* Dedicated Section Panel (Desktop Only) */}
        <div className="hidden md:block flex-1 min-w-0">
          {activeTab === "profile" && renderProfileCard()}
          {activeTab === "preferences" && renderPreferencesCard()}
          {activeTab === "timezone" && renderTimezoneCard()}
          {activeTab === "notifications" && renderNotificationsCard()}
          {activeTab === "logout" && renderLogoutCard()}
        </div>
      </div>

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
        <DialogContent className="w-[95vw] max-w-lg p-5 rounded-2xl max-h-[85vh] overflow-y-auto">
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
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-muted-foreground">Loading settings...</div>}>
      <SettingsContent />
    </Suspense>
  );
}
