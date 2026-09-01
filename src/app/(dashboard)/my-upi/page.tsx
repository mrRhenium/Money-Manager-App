"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody } from "@/components/ui/dialog";
import { 
  QrCode, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  Download, 
  Share2, 
  ShieldCheck, 
  Sparkles, 
  Smartphone, 
  Landmark, 
  CheckCircle2, 
  Maximize2,
  Loader2,
  SlidersHorizontal,
  Wallet
} from "lucide-react";
import { getUserProfile, updateProfile } from "@/actions/user";
import { useToast } from "@/hooks/useToast";
import { QRCodeSVG, QRCodeCanvas } from "qrcode.react";
import { MasterHeader } from "@/components/layout/MasterHeader";
import { Select } from "antd";
import { UpiAppLogo } from "@/components/upi/UpiAppLogo";
import { cn } from "@/lib/utils";
import { TYPOGRAPHY } from "@/lib/designTokens";

const POPULAR_HANDLES = ["@okaxis", "@okicici", "@okhdfcbank", "@oksbi", "@paytm", "@ybl"];
const PRESET_AMOUNTS = [100, 200, 500, 1000, 2000];

function getUpiProvider(vpa: string) {
  const handle = vpa.split("@")[1]?.toLowerCase() || "";
  if (handle.includes("okicici") || handle.includes("icici")) {
    return { name: "ICICI Bank", appId: "gpay", badgeColor: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30" };
  }
  if (handle.includes("okhdfc") || handle.includes("hdfc")) {
    return { name: "HDFC Bank", appId: "gpay", badgeColor: "bg-blue-600/10 text-blue-600 dark:text-blue-400 border-blue-600/30" };
  }
  if (handle.includes("okaxis") || handle.includes("axis")) {
    return { name: "Axis Bank", appId: "gpay", badgeColor: "bg-rose-600/10 text-rose-600 dark:text-rose-400 border-rose-600/30" };
  }
  if (handle.includes("oksbi") || handle.includes("sbi")) {
    return { name: "SBI", appId: "bhim", badgeColor: "bg-cyan-600/10 text-cyan-600 dark:text-cyan-400 border-cyan-600/30" };
  }
  if (handle.includes("paytm")) {
    return { name: "Paytm", appId: "paytm", badgeColor: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30" };
  }
  if (handle.includes("ybl") || handle.includes("ibl") || handle.includes("axl")) {
    return { name: "PhonePe", appId: "phonepe", badgeColor: "bg-purple-600/10 text-purple-600 dark:text-purple-400 border-purple-600/30" };
  }
  if (handle.includes("apl") || handle.includes("amazon")) {
    return { name: "Amazon Pay", appId: "amazonpay", badgeColor: "bg-amber-600/10 text-amber-600 dark:text-amber-400 border-amber-600/30" };
  }
  return { name: "UPI Handle", appId: "bhim", badgeColor: "bg-primary/10 text-primary border-primary/30" };
}

function MyUpiContent() {
  const { data: session } = useSession();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [upiIds, setUpiIds] = useState<string[]>([]);
  const [newUpiInput, setNewUpiInput] = useState("");
  const [selectedUpiForQr, setSelectedUpiForQr] = useState<string>("");
  const [mobileTab, setMobileTab] = useState<"upis" | "qr">("upis");
  const [requestedAmount, setRequestedAmount] = useState<string>("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const rightCardRef = useRef<HTMLDivElement>(null);
  const addUpiCardRef = useRef<HTMLDivElement>(null);
  const [lowerCardHeight, setLowerCardHeight] = useState<number | null>(null);

  useEffect(() => {
    const updateHeight = () => {
      if (typeof window === "undefined") return;
      if (window.innerWidth < 1024) {
        setLowerCardHeight(null);
        return;
      }
      if (rightCardRef.current && addUpiCardRef.current) {
        const rightH = rightCardRef.current.offsetHeight;
        const addUpiH = addUpiCardRef.current.offsetHeight;
        // 16px corresponds to the gap-4 between the two left cards
        const targetH = Math.max(220, rightH - addUpiH - 16);
        setLowerCardHeight(targetH);
      }
    };

    // Run after DOM paint
    const timer = setTimeout(updateHeight, 50);

    const observer = new ResizeObserver(updateHeight);
    if (rightCardRef.current) observer.observe(rightCardRef.current);
    if (addUpiCardRef.current) observer.observe(addUpiCardRef.current);
    window.addEventListener("resize", updateHeight);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
      window.removeEventListener("resize", updateHeight);
    };
  }, [selectedUpiForQr, requestedAmount, upiIds.length]);

  useEffect(() => {
    if (!session?.user?.id) return;
    getUserProfile().then((user) => {
      setName(user.name || session.user.name || "User");
      if (user.upiIds && user.upiIds.length > 0) {
        setUpiIds(user.upiIds);
        setSelectedUpiForQr(user.upiIds[0]);
      }
    }).catch(console.error);
  }, [session?.user?.id, session?.user?.name]);

  const copyToClipboard = (text: string, key: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success(`${label} copied to clipboard!`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleAddUpi = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newUpiInput.trim().toLowerCase();
    if (!trimmed) {
      toast.error("Please enter a valid UPI ID");
      return;
    }
    if (!trimmed.includes("@") || trimmed.startsWith("@") || trimmed.endsWith("@")) {
      toast.error("Invalid format. Format must be 'username@bank'");
      return;
    }
    if (upiIds.includes(trimmed)) {
      toast.error("This UPI ID is already in your list");
      return;
    }

    const updated = [...upiIds, trimmed];
    setUpiIds(updated);
    if (!selectedUpiForQr) setSelectedUpiForQr(trimmed);
    setNewUpiInput("");
    saveUpiList(updated);
  };

  const handleDeleteUpi = (idxToRemove: number) => {
    const target = upiIds[idxToRemove];
    const updated = upiIds.filter((_, i) => i !== idxToRemove);
    setUpiIds(updated);
    if (selectedUpiForQr === target) {
      setSelectedUpiForQr(updated.length > 0 ? updated[0] : "");
    }
    saveUpiList(updated);
  };

  const handleSelectActiveUpi = async (vpa: string) => {
    setSelectedUpiForQr(vpa);
    // Put the selected UPI ID at index 0 so it becomes the primary receiving handle
    const reordered = [vpa, ...upiIds.filter(id => id !== vpa)];
    setUpiIds(reordered);
    await saveUpiList(reordered, `${vpa} saved as primary QR!`);
  };

  const saveUpiList = async (listToSave: string[], successMsg = "UPI IDs saved successfully!") => {
    try {
      setIsSaving(true);
      const cleaned = listToSave.map(v => v.trim()).filter(Boolean);
      await updateProfile({ name, mobile: "", upiIds: cleaned } as any);
      toast.success(successMsg);
    } catch (error: any) {
      toast.error(error.message || "Failed to save UPI IDs");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadQr = () => {
    const canvas = document.getElementById("active-qr-canvas") as HTMLCanvasElement;
    if (!canvas) {
      toast.error("Could not generate QR image for download");
      return;
    }
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `UPI-QR-${selectedUpiForQr || "pay"}${requestedAmount ? `-INR${requestedAmount}` : ""}.png`;
    a.click();
    toast.success("QR Code image downloaded successfully!");
  };

  const handleShareQr = async () => {
    const shareText = `Pay ${name || "me"} securely using UPI: ${selectedUpiForQr}${requestedAmount ? ` for ₹${requestedAmount}` : ""}`;
    const shareUrl = generatedUpiUrl;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `UPI Payment to ${name}`,
          text: shareText,
          url: shareUrl,
        });
      } catch {
        copyToClipboard(shareUrl, "share", "Payment Link");
      }
    } else {
      copyToClipboard(shareUrl, "share", "Payment Link");
    }
  };

  // Construct UPI Deep-link
  const parsedAmount = parseFloat(requestedAmount);
  const amountParam = !isNaN(parsedAmount) && parsedAmount > 0 ? `&am=${parsedAmount.toFixed(2)}&cu=INR` : "";
  const generatedUpiUrl = selectedUpiForQr 
    ? `upi://pay?pa=${encodeURIComponent(selectedUpiForQr)}&pn=${encodeURIComponent(name || "User")}${amountParam}`
    : "";

  return (
    <div className="absolute inset-0 flex flex-col bg-slate-50/50 dark:bg-background overflow-hidden">
      {/* Hidden high-res canvas used exclusively for 1-click PNG downloads */}
      {generatedUpiUrl && (
        <div className="hidden">
          <QRCodeCanvas
            id="active-qr-canvas"
            value={generatedUpiUrl}
            size={600}
            level="H"
            includeMargin
            imageSettings={{
              src: "/icon-512x512.png",
              height: 70,
              width: 70,
              excavate: true,
            }}
          />
        </div>
      )}

      {/* HEADER SECTION */}
      <MasterHeader 
        title={<><QrCode className="w-6 h-6 text-primary" /> My UPI & QR</>}
        subtitle="Manage your UPI IDs, customize payment handles, and share receiving QR codes."
      />

      {/* MAIN CONTENT WRAPPER */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pb-24 lg:pb-4 pt-3 sm:pt-4 px-3 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-4">

          {/* Quick Info & Security Banner */}
          <div className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 shadow-xs">
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-sm shrink-0">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className={cn(TYPOGRAPHY.cardTitle, "font-bold flex items-center gap-2")}>
                  Zero-Fee Instant Receiving
                  <span className={cn(TYPOGRAPHY.badge, "inline-flex items-center gap-1 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-bold")}>
                    <CheckCircle2 className="w-3 h-3" /> Real-time
                  </span>
                </h3>
                <p className={cn(TYPOGRAPHY.cardSubtitle, "text-muted-foreground mt-0.5")}>
                  Payments are credited directly to your bank account with complete UPI interoperability.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-stretch sm:self-auto shrink-0">
              <div className={cn(TYPOGRAPHY.cardLabel, "flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border font-semibold shadow-2xs")}>
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>NPCI Verified</span>
              </div>
              <div className={cn(TYPOGRAPHY.cardLabel, "flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border font-semibold shadow-2xs")}>
                <Wallet className="w-4 h-4 text-primary" />
                <span>{upiIds.length} {upiIds.length === 1 ? "UPI ID" : "UPI IDs"}</span>
              </div>
            </div>
          </div>

          {/* Mobile Tab Switcher */}
          <div className="lg:hidden flex p-1 bg-muted/70 dark:bg-muted/30 rounded-2xl border border-border/60 shadow-2xs">
            <button
              type="button"
              onClick={() => setMobileTab("upis")}
              className={cn(
                "flex-1 py-2 px-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 cursor-pointer",
                TYPOGRAPHY.btnSm,
                mobileTab === "upis"
                  ? "bg-card text-primary shadow-xs border border-border/50"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>My UPI IDs</span>
              <span className={cn(TYPOGRAPHY.badge, "px-1.5 py-0.2 rounded-full bg-primary/10 text-primary font-mono")}>
                {upiIds.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setMobileTab("qr")}
              className={cn(
                "flex-1 py-2 px-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 cursor-pointer",
                TYPOGRAPHY.btnSm,
                mobileTab === "qr"
                  ? "bg-card text-primary shadow-xs border border-border/50"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>QR Code Stand</span>
              {selectedUpiForQr && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </button>
          </div>

          {/* 2-Column Responsive Grid */}
          <div className="grid gap-4 sm:gap-5 lg:gap-6 lg:grid-cols-12 items-start">

            {/* ── LEFT COLUMN (7 Cols on LG): UPI IDs Manager ── */}
            <div className={cn("lg:col-span-7 flex flex-col gap-4", mobileTab !== "upis" && "hidden lg:flex")}>

              {/* Add New UPI ID Card - Zero vertical padding on parent card */}
              <Card ref={addUpiCardRef} className="shadow-xs border-border/70 overflow-hidden !py-0 shrink-0">
                <CardHeader className="p-3.5 sm:p-4 border-b border-border/50 bg-muted/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className={cn(TYPOGRAPHY.sectionTitle, "flex items-center gap-2")}>
                        <Plus className="w-4 h-4 text-primary" /> Add New UPI ID
                      </CardTitle>
                      <CardDescription className={cn(TYPOGRAPHY.cardSubtitle, "mt-0.5")}>
                        Link your Google Pay, PhonePe, Paytm, or Bank VPA handles
                      </CardDescription>
                    </div>
                    {isSaving && (
                      <span className={cn(TYPOGRAPHY.cardSubtitle, "flex items-center gap-1 text-primary font-medium")}>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-3.5 sm:p-4 space-y-3">
                  <form onSubmit={handleAddUpi} className="flex flex-col sm:flex-row gap-2.5">
                    <div className="relative flex-1">
                      <Input
                        placeholder="e.g. mobile-number@okhdfcbank"
                        value={newUpiInput}
                        onChange={(e) => setNewUpiInput(e.target.value)}
                        className={cn(TYPOGRAPHY.modalInput, "h-9 sm:h-10 font-mono pr-8")}
                      />
                    </div>
                    <Button type="submit" className={cn(TYPOGRAPHY.btnSm, "h-9 sm:h-10 px-4 sm:px-5 font-semibold shrink-0 shadow-xs")} disabled={isSaving}>
                      <Plus className="w-4 h-4 mr-1.5" /> Add UPI ID
                    </Button>
                  </form>

                  {/* Quick Handle Suggestions */}
                  <div>
                    <span className={cn(TYPOGRAPHY.cardLabel, "block mb-1.5")}>
                      Popular Bank Handles (Click to append):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {POPULAR_HANDLES.map((handle) => (
                        <button
                          key={handle}
                          type="button"
                          onClick={() => {
                            const prefix = newUpiInput.split("@")[0] || "";
                            setNewUpiInput(prefix ? `${prefix}${handle}` : handle);
                          }}
                          className={cn(
                            TYPOGRAPHY.btnXs,
                            "px-2.5 py-0.5 sm:py-1 rounded-lg font-mono font-medium border bg-muted/30 hover:bg-primary/10 hover:border-primary/40 hover:text-primary transition-all cursor-pointer"
                          )}
                        >
                          {handle}
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Configured UPI IDs List - Matches height of right card */}
              <Card 
                style={lowerCardHeight ? { height: `${lowerCardHeight}px` } : undefined}
                className="shadow-xs border-border/70 overflow-hidden flex flex-col !py-0"
              >
                <CardHeader className="p-3 sm:p-4 border-b border-border/50 bg-muted/20 flex flex-row items-center justify-between shrink-0">
                  <div>
                    <CardTitle className={cn(TYPOGRAPHY.sectionTitle, "flex items-center gap-2")}>
                      <Landmark className="w-4 h-4 text-primary" /> Active Receiving Handles
                    </CardTitle>
                    <CardDescription className={cn(TYPOGRAPHY.cardSubtitle, "mt-0.5")}>
                      Select which ID displays on your active QR code stand
                    </CardDescription>
                  </div>
                  <span className={cn(TYPOGRAPHY.badge, "px-2 sm:px-2.5 py-0.5 rounded-full bg-primary/10 text-primary shrink-0")}>
                    {upiIds.length} Configured
                  </span>
                </CardHeader>
                <CardContent className="p-2.5 sm:p-3.5 space-y-2.5 flex-1 min-h-0 overflow-y-auto custom-scrollbar">
                  {upiIds.length > 0 ? (
                    upiIds.map((vpa, idx) => {
                      const isSelected = selectedUpiForQr === vpa;
                      const provider = getUpiProvider(vpa);
                      const isCopied = copiedKey === `list-${vpa}`;

                      return (
                        <div
                          key={idx}
                          className={cn(
                            "relative group rounded-2xl border p-3 sm:p-4 transition-all flex flex-col gap-2.5",
                            isSelected
                              ? "bg-primary/5 border-primary/40 ring-1 ring-primary/20 shadow-xs"
                              : "bg-card hover:bg-muted/30 border-border/70 hover:border-border"
                          )}
                        >
                          {/* Top Row: Provider Logo, VPA handle & Active status */}
                          <div className="flex items-center gap-2.5 min-w-0">
                            <UpiAppLogo appId={provider.appId} size="md" className="shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-xl" />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-1.5">
                                <span className={cn(TYPOGRAPHY.cardValue, "font-mono font-bold truncate select-all")}>
                                  {vpa}
                                </span>
                                {isSelected && (
                                  <span className={cn(TYPOGRAPHY.badge, "inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold bg-primary text-primary-foreground shrink-0 shadow-2xs")}>
                                    <Sparkles className="w-2.5 h-2.5" /> Active
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className={cn(TYPOGRAPHY.badge, "px-1.5 py-0.2 rounded border", provider.badgeColor)}>
                                  {provider.name}
                                </span>
                                <span className={cn(TYPOGRAPHY.cardSubtitle, "text-muted-foreground")}>Handle #{idx + 1}</span>
                              </div>
                            </div>
                          </div>

                          {/* Bottom Action Strip */}
                          <div className="flex items-center justify-between pt-2 border-t border-border/40 gap-2">
                            <div>
                              {isSelected ? (
                                <span className={cn(TYPOGRAPHY.cardSubtitle, "inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400")}>
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Linked to QR
                                </span>
                              ) : (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    handleSelectActiveUpi(vpa);
                                    setMobileTab("qr");
                                  }}
                                  className={cn(TYPOGRAPHY.btnXs, "h-7 px-2.5 font-semibold rounded-lg hover:bg-primary/10 hover:text-primary hover:border-primary/40")}
                                >
                                  Show on QR
                                </Button>
                              )}
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => copyToClipboard(vpa, `list-${vpa}`, "UPI ID")}
                                className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
                                title="Copy UPI ID"
                              >
                                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteUpi(idx)}
                                className="h-7 w-7 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                title="Remove UPI ID"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-10 px-4 border-2 border-dashed rounded-2xl border-border/70 bg-muted/10">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
                        <QrCode className="w-6 h-6" />
                      </div>
                      <h4 className={cn(TYPOGRAPHY.cardTitle, "font-bold text-foreground")}>No UPI IDs Configured</h4>
                      <p className={cn(TYPOGRAPHY.cardSubtitle, "text-muted-foreground max-w-sm mx-auto mt-1 mb-4")}>
                        Add your primary Virtual Payment Address (e.g. mobile@okhdfcbank) to generate your high-res receiving QR code.
                      </p>
                      <Button onClick={() => setNewUpiInput("yourname@okicici")} variant="outline" size="sm" className={TYPOGRAPHY.btnXs}>
                        Fill Sample ID
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

            </div>

            {/* ── RIGHT COLUMN (5 Cols on LG): Premium Payment Stand & QR Card ── */}
            <div className={cn("lg:col-span-5 sticky top-4", mobileTab !== "qr" && "hidden lg:block")}>
              <Card 
                ref={rightCardRef}
                className="shadow-md border border-border/80 bg-gradient-to-b from-card via-card to-secondary/15 rounded-3xl overflow-hidden !py-0"
              >
                
                {/* Stand Header Strip - Soft, elegant, non-overwhelming */}
                <div className="px-4 py-2.5 bg-muted/40 dark:bg-muted/20 border-b border-border/60 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={cn(TYPOGRAPHY.cardValue, "w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold border border-primary/20 shrink-0 shadow-2xs")}>
                      {name ? name.charAt(0).toUpperCase() : "U"}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 leading-none">
                        <span className={cn(TYPOGRAPHY.cardTitle, "font-bold truncate text-foreground")}>
                          {name || "Verified Payee"}
                        </span>
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      </div>
                      <span className={cn(TYPOGRAPHY.cardLabel, "text-muted-foreground font-mono tracking-wider block mt-0.5 uppercase")}>
                        BHIM UPI QR STAND
                      </span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setQrModalOpen(true)}
                    className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg shrink-0"
                    title="Fullscreen Preview"
                    disabled={!selectedUpiForQr}
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </Button>
                </div>

                <CardContent className="px-4 pt-3 pb-3 sm:px-5 sm:pt-3.5 sm:pb-3.5 flex flex-col items-center gap-3.5">
                  
                  {/* Select VPA Switcher */}
                  {upiIds.length > 1 && (
                    <div className="w-full">
                      <div className="flex items-center justify-between mb-1.5">
                        <Label className={cn(TYPOGRAPHY.cardLabel, "block")}>
                          Select Active QR VPA
                        </Label>
                        <span className={cn(TYPOGRAPHY.badge, "font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1")}>
                          <CheckCircle2 className="w-3 h-3" /> Auto-saved as Default
                        </span>
                      </div>
                      <Select
                        value={selectedUpiForQr}
                        onChange={handleSelectActiveUpi}
                        className="w-full h-10"
                        options={upiIds.map(vpa => ({
                          label: vpa,
                          value: vpa
                        }))}
                      />
                    </div>
                  )}

                  {/* QR Code Presentation Box */}
                  {selectedUpiForQr ? (
                    <div className="w-full flex flex-col items-center">
                      <div className="relative group p-4 sm:p-5 bg-white rounded-3xl shadow-md border-2 border-slate-200/90 dark:border-slate-700/80 transition-all hover:shadow-xl flex flex-col items-center">
                        <QRCodeSVG
                          value={generatedUpiUrl}
                          size={210}
                          level="H"
                          includeMargin={false}
                          imageSettings={{
                            src: "/icon-512x512.png",
                            height: 38,
                            width: 38,
                            excavate: true,
                          }}
                        />

                        {/* Amount Overlay Tag if set */}
                        {requestedAmount && parseFloat(requestedAmount) > 0 && (
                          <div className={cn(TYPOGRAPHY.cardValue, "mt-3 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 shadow-2xs")}>
                            Amount: ₹{parseFloat(requestedAmount).toLocaleString("en-IN")}
                          </div>
                        )}
                      </div>

                      {/* Displayed UPI ID Pill with Quick Copy */}
                      <div className="mt-4 flex items-center justify-between w-full max-w-xs px-3.5 py-2 rounded-xl bg-muted/40 border border-border/60">
                        <div className="min-w-0 flex-1">
                          <span className={cn(TYPOGRAPHY.cardLabel, "block")}>Receiving UPI ID</span>
                          <span className={cn(TYPOGRAPHY.cardValue, "font-mono font-bold truncate block select-all")}>
                            {selectedUpiForQr}
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => copyToClipboard(selectedUpiForQr, "card-upi", "UPI ID")}
                          className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground shrink-0 ml-2"
                          title="Copy UPI ID"
                        >
                          {copiedKey === "card-upi" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </Button>
                      </div>

                      {/* Specific Amount Parameter Toggle */}
                      <div className="w-full mt-4 pt-4 border-t border-border/50">
                        <div className="flex items-center justify-between mb-2">
                          <Label className={cn(TYPOGRAPHY.modalFieldLabel, "flex items-center gap-1.5")}>
                            <SlidersHorizontal className="w-3.5 h-3.5 text-primary" /> Request Specific Amount (Optional)
                          </Label>
                          {requestedAmount && (
                            <button
                              type="button"
                              onClick={() => setRequestedAmount("")}
                              className={cn(TYPOGRAPHY.btnXs, "font-semibold text-muted-foreground hover:text-destructive cursor-pointer")}
                            >
                              Reset
                            </button>
                          )}
                        </div>

                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground text-[length:var(--font-size-modal-input)]">₹</span>
                          <Input
                            type="number"
                            min="1"
                            step="any"
                            placeholder="Enter amount (e.g. 500)"
                            value={requestedAmount}
                            onChange={(e) => setRequestedAmount(e.target.value)}
                            className={cn(TYPOGRAPHY.modalInput, "h-9 pl-7 font-medium")}
                          />
                        </div>

                        {/* Quick Preset Buttons */}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {PRESET_AMOUNTS.map((amt) => (
                            <button
                              key={amt}
                              type="button"
                              onClick={() => setRequestedAmount(String(amt))}
                              className={cn(
                                TYPOGRAPHY.btnXs,
                                "px-2.5 py-0.5 rounded-lg font-bold border transition-all cursor-pointer",
                                requestedAmount === String(amt)
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "bg-muted/30 hover:bg-muted text-muted-foreground hover:text-foreground"
                              )}
                            >
                              ₹{amt}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Supported Apps Strip */}
                      <div className="w-full mt-4 pt-3 border-t border-border/40 flex flex-col items-center gap-2">
                        <span className={cn(TYPOGRAPHY.cardLabel, "block")}>
                          Works with all UPI Apps
                        </span>
                        <div className="flex items-center justify-center gap-2.5">
                          <UpiAppLogo appId="gpay" size="sm" />
                          <UpiAppLogo appId="phonepe" size="sm" />
                          <UpiAppLogo appId="paytm" size="sm" />
                          <UpiAppLogo appId="bhim" size="sm" />
                          <UpiAppLogo appId="amazonpay" size="sm" />
                        </div>
                      </div>

                      {/* Action Buttons Bar */}
                      <div className="grid grid-cols-2 gap-2.5 w-full mt-3">
                        <Button
                          type="button"
                          onClick={handleDownloadQr}
                          className={cn(TYPOGRAPHY.btnDefault, "h-10 font-bold rounded-xl shadow-xs flex items-center justify-center gap-1.5")}
                        >
                          <Download className="w-4 h-4" /> Download QR
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleShareQr}
                          className={cn(TYPOGRAPHY.btnDefault, "h-10 font-semibold rounded-xl flex items-center justify-center gap-1.5")}
                        >
                          {copiedKey === "share" ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
                          Share Link
                        </Button>
                      </div>

                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <QrCode className="w-12 h-12 mx-auto mb-2 opacity-30" />
                      <p className={TYPOGRAPHY.cardSubtitle}>Select or add a UPI ID to preview QR code</p>
                    </div>
                  )}

                </CardContent>
              </Card>
            </div>

          </div>

        </div>
      </div>

      {/* Fullscreen QR Modal */}
      {selectedUpiForQr && (
        <Dialog open={qrModalOpen} onOpenChange={setQrModalOpen}>
          <DialogContent initialFocus={false} size="md">
            <DialogHeader>
              <DialogTitle className={TYPOGRAPHY.modalTitle}>
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <QrCode className="w-4 h-4" />
                </div>
                <span>Official UPI Receiving QR</span>
              </DialogTitle>
              <DialogDescription className={TYPOGRAPHY.modalDescription}>
                Scan with Google Pay, PhonePe, Paytm, BHIM, or any bank UPI app.
              </DialogDescription>
            </DialogHeader>
            <DialogBody className="flex flex-col items-center justify-center p-6 space-y-4">
              <div className="p-6 bg-white rounded-3xl shadow-xl border-2 border-primary/20 flex flex-col items-center justify-center">
                <QRCodeSVG
                  value={generatedUpiUrl}
                  size={260}
                  level="H"
                  imageSettings={{
                    src: "/icon-512x512.png",
                    height: 56,
                    width: 56,
                    excavate: true,
                  }}
                />
                {requestedAmount && parseFloat(requestedAmount) > 0 && (
                  <div className={cn(TYPOGRAPHY.cardValue, "mt-4 px-4 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200")}>
                    Pay Exactly: ₹{parseFloat(requestedAmount).toLocaleString("en-IN")}
                  </div>
                )}
              </div>
              <div className="text-center space-y-1">
                <p className={cn(TYPOGRAPHY.cardAmount, "font-bold font-mono text-foreground px-4 py-1.5 rounded-full bg-muted border border-border/60")}>
                  {selectedUpiForQr}
                </p>
                <p className={cn(TYPOGRAPHY.cardSubtitle, "text-muted-foreground")}>
                  Registered to <span className="font-semibold text-foreground">{name}</span>
                </p>
              </div>
              <div className="flex gap-2 w-full pt-2">
                <Button onClick={handleDownloadQr} className={cn(TYPOGRAPHY.btnDefault, "flex-1 font-bold h-10 rounded-xl")}>
                  <Download className="w-4 h-4 mr-1.5" /> Download QR
                </Button>
                <Button onClick={handleShareQr} variant="outline" className={cn(TYPOGRAPHY.btnDefault, "flex-1 font-semibold h-10 rounded-xl")}>
                  <Share2 className="w-4 h-4 mr-1.5" /> Share
                </Button>
              </div>
            </DialogBody>
          </DialogContent>
        </Dialog>
      )}

    </div>
  );
}

export default function MyUpiPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>}>
      <MyUpiContent />
    </Suspense>
  );
}
