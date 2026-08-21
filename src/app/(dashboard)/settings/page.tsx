"use client";

import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, User, Bell, Palette, Globe } from "lucide-react";
import { useState, useEffect } from "react";
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

export default function SettingsPage() {
  const { data: session, update: updateSession } = useSession();
  const { toast } = useToast();
  const [isSubscribed, setIsSubscribed] = useState(false);
  
  const [name, setName] = useState(session?.user?.name || "");
  const [mobile, setMobile] = useState("");
  const [themeColor, setThemeColor] = useState((session?.user as any)?.themeColor || "#0ea5e9");
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isThemeLoading, setIsThemeLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "preferences" | "timezone" | "notifications" | "logout">("profile");

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

  const handleThemeColorChange = async (color: string | null) => {
    try {
      setIsThemeLoading(true);
      await updateThemeColor(color);
      await updateSession(); // Refresh session data
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

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      toast.warning("Permission denied");
      return;
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    await subscribeUser(subscription);
    setIsSubscribed(true);
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar Navigation */}
        <div className="w-full md:w-64 shrink-0 flex flex-row md:flex-col gap-1 overflow-x-auto pb-2 md:pb-0 border-b md:border-b-0 md:border-r md:pr-4">
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex items-center gap-2.5 px-4 py-2 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap text-left w-full ${
              activeTab === "profile"
                ? "bg-primary text-white"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <User className="w-4 h-4" />
            Profile Information
          </button>
          <button
            onClick={() => setActiveTab("preferences")}
            className={`flex items-center gap-2.5 px-4 py-2 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap text-left w-full ${
              activeTab === "preferences"
                ? "bg-primary text-white"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Palette className="w-4 h-4" />
            Preferences
          </button>
          <button
            onClick={() => setActiveTab("timezone")}
            className={`flex items-center gap-2.5 px-4 py-2 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap text-left w-full ${
              activeTab === "timezone"
                ? "bg-primary text-white"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Globe className="w-4 h-4" />
            Global Timezone
          </button>
          <button
            onClick={() => setActiveTab("notifications")}
            className={`flex items-center gap-2.5 px-4 py-2 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap text-left w-full ${
              activeTab === "notifications"
                ? "bg-primary text-white"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Bell className="w-4 h-4" />
            Notifications
          </button>
          <button
            onClick={() => setActiveTab("logout")}
            className={`flex items-center gap-2.5 px-4 py-2 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap text-left w-full ${
              activeTab === "logout"
                ? "bg-primary text-white"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>

        {/* Dedicated Section Panel */}
        <div className="flex-1 min-w-0">
          {activeTab === "profile" && (
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your account details here.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
                <Button className="mt-4" onClick={handleProfileSave} disabled={isProfileLoading}>
                  {isProfileLoading ? "Saving..." : "Save Changes"}
                </Button>
              </CardContent>
            </Card>
          )}

          {activeTab === "preferences" && (
            <Card>
              <CardHeader>
                <CardTitle>Preferences</CardTitle>
                <CardDescription>Customize your Money Manager experience.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
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
              </CardContent>
            </Card>
          )}

          {activeTab === "timezone" && (
            <Card>
              <CardHeader>
                <CardTitle>Global Timezone</CardTitle>
                <CardDescription>All transactions and dates will be displayed according to this timezone.</CardDescription>
              </CardHeader>
              <CardContent>
                <TimezonePicker initialTimezone={(session?.user as any)?.timezone || "UTC"} />
              </CardContent>
            </Card>
          )}

          {activeTab === "notifications" && (
            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Receive web push notifications for bill reminders and alerts.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
              </CardContent>
            </Card>
          )}

          {activeTab === "logout" && (
            <Card className="border-red-500/20">
              <CardContent className="flex items-center justify-between p-6">
                <div>
                  <p className="font-semibold text-foreground">Sign Out</p>
                  <p className="text-sm text-muted-foreground mt-0.5">Sign out of your account on this device.</p>
                </div>
                <Button variant="destructive" onClick={() => signOut({ callbackUrl: "/login" })}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
