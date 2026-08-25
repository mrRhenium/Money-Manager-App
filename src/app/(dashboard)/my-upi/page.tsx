"use client";

import { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { QrCode, Plus, Trash, Copy, Loader2, ArrowLeft, Smartphone, Shield, Hash } from "lucide-react";
import { getUserProfile, updateProfile } from "@/actions/user";
import { useToast } from "@/hooks/useToast";
import { QRCodeSVG } from "qrcode.react";
import Link from "next/link";
import { MasterHeader } from "@/components/layout/MasterHeader";

function MyUpiContent() {
  const { data: session } = useSession();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [upiIds, setUpiIds] = useState<string[]>([]);
  const [selectedUpiForQr, setSelectedUpiForQr] = useState<string>("");
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!session?.user?.id) return;
    getUserProfile().then((user) => {
      setName(user.name || session.user.name || "");
      if (user.upiIds) {
        setUpiIds(user.upiIds);
        if (user.upiIds.length > 0) setSelectedUpiForQr(user.upiIds[0]);
      }
    }).catch(console.error).finally(() => setIsLoading(false));
  }, [session?.user?.id]);

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${type} copied to clipboard!`);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const cleanedUpiIds = upiIds.map(v => v.trim()).filter(v => v !== "");
      await updateProfile({ name, mobile: "", upiIds: cleanedUpiIds } as any);
      toast.success("UPI IDs saved successfully!");
      setUpiIds(cleanedUpiIds);
      if (cleanedUpiIds.length > 0 && !cleanedUpiIds.includes(selectedUpiForQr)) {
        setSelectedUpiForQr(cleanedUpiIds[0]);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to save UPI IDs");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-12 text-center text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>;
  }

  const generatedUpiUrl = selectedUpiForQr ? `upi://pay?pa=${selectedUpiForQr}&pn=${encodeURIComponent(name || "User")}` : "";
  const activeIds = upiIds.filter(v => v.trim() !== "");

  return (
    <div className="absolute inset-0 flex flex-col bg-slate-50/50 dark:bg-background overflow-hidden">

      {/* HEADER SECTION */}
      <MasterHeader 
        title={<><QrCode className="w-6 h-6 text-primary" /> My UPI & QR</>}
        subtitle="Manage your UPI IDs and share your receiving QR code."
      />

      {/* CONTENT SECTION */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pb-24 pt-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-6">



          {/* Main Content - Two Column Layout */}
          <div className="grid gap-6 lg:grid-cols-5">

            {/* Left Column - UPI IDs Management */}
            <Card className="lg:col-span-3 shadow-sm border border-slate-200/60 dark:border-slate-800">
              <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border/50">
                <div>
                  <CardTitle className="text-lg">My UPI IDs</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1 hidden sm:block">Add your VPA/UPI IDs to generate receiving QR codes.</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={() => {
                    if (upiIds.length === 0 || upiIds[upiIds.length - 1].trim() !== "") {
                      setUpiIds([...upiIds, ""]);
                    } else {
                      toast.error("Please fill in the empty UPI ID before adding a new one.");
                    }
                  }} variant="outline" size="sm" className="h-8">
                    <Plus className="w-4 h-4 mr-1" /> Add
                  </Button>
                  <Button onClick={handleSave} disabled={isSaving} size="sm" className="h-8">
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 md:p-6 space-y-3">
                {upiIds.map((vpa, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary text-xs font-bold">
                      {idx + 1}
                    </div>
                    <Input
                      placeholder="e.g. yourname@okicici"
                      value={vpa}
                      onChange={(e) => {
                        const newIds = [...upiIds];
                        newIds[idx] = e.target.value;
                        setUpiIds(newIds);
                      }}
                      className="flex-1"
                    />
                    <Button type="button" variant="outline" size="icon" className="shrink-0" onClick={() => copyToClipboard(vpa, "UPI ID")} disabled={!vpa}>
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-destructive" onClick={() => {
                      setUpiIds(upiIds.filter((_, i) => i !== idx));
                    }}>
                      <Trash className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                {upiIds.length === 0 && (
                  <p className="text-sm text-muted-foreground italic bg-secondary/30 p-4 rounded-xl border text-center">
                    No UPI IDs added yet. Click &quot;Add&quot; to start.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Right Column - QR Code */}
            <Card className="lg:col-span-2 shadow-sm border border-slate-200/60 dark:border-slate-800">
              <CardHeader className="border-b border-border/50">
                <CardTitle className="text-lg font-bold text-foreground">My Receiving QR Code</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Share this to receive payments.</p>
              </CardHeader>
              <CardContent className="p-4 md:p-6 flex flex-col items-center gap-6">
                {activeIds.length > 0 ? (
                  <>
                    <div className="w-full">
                      <Label className="text-xs text-muted-foreground mb-2 block">Select UPI ID for QR Code</Label>
                      <select
                        className="flex h-10 w-full items-center justify-between rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                        value={selectedUpiForQr}
                        onChange={(e) => setSelectedUpiForQr(e.target.value)}
                      >
                        {activeIds.map((vpa, i) => (
                          <option key={i} value={vpa}>{vpa}</option>
                        ))}
                      </select>
                    </div>

                    {generatedUpiUrl && (
                      <>
                        <button
                          type="button"
                          onClick={() => setQrModalOpen(true)}
                          className="p-6 bg-white rounded-3xl shadow-sm border hover:shadow-md transition-all cursor-pointer relative group flex flex-col items-center gap-3"
                        >
                          <QRCodeSVG
                            value={generatedUpiUrl}
                            size={200}
                            level="M"
                            imageSettings={{
                              src: "/icon-512x512.png",
                              x: undefined,
                              y: undefined,
                              height: 40,
                              width: 40,
                              excavate: true,
                            }}
                          />
                          <span className="text-sm font-semibold text-primary font-mono">{selectedUpiForQr}</span>
                          <div className="absolute inset-0 bg-black/5 rounded-3xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <span className="bg-black/60 text-white text-xs px-3 py-1.5 rounded-full font-medium shadow-sm">Click to Enlarge</span>
                          </div>
                        </button>

                        <Dialog open={qrModalOpen} onOpenChange={setQrModalOpen}>
                          <DialogContent className="sm:max-w-md flex flex-col items-center justify-center p-8 border-none bg-white/95 backdrop-blur shadow-2xl">
                            <DialogHeader className="mb-4">
                              <DialogTitle className="text-center text-xl font-bold">My QR Code</DialogTitle>
                            </DialogHeader>
                            <div className="p-6 bg-white rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.1)] border-4 border-primary/10">
                              <QRCodeSVG
                                value={generatedUpiUrl}
                                size={300}
                                level="M"
                                imageSettings={{
                                  src: "/icon-512x512.png",
                                  x: undefined,
                                  y: undefined,
                                  height: 70,
                                  width: 70,
                                  excavate: true,
                                }}
                              />
                            </div>
                            <p className="mt-6 text-base font-semibold text-center text-foreground bg-primary/10 px-6 py-2.5 rounded-full border border-primary/20">
                              {selectedUpiForQr}
                            </p>
                            <p className="text-sm text-muted-foreground mt-3 text-center max-w-xs">
                              Scan this QR code with any UPI app (GPay, PhonePe, Paytm, etc.) to pay {name}.
                            </p>
                          </DialogContent>
                        </Dialog>
                      </>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground italic bg-secondary/30 p-4 rounded-xl border w-full text-center">
                    Add a UPI ID above and save to generate your QR code.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
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
