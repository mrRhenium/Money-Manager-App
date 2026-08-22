"use client";

import { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { QrCode, Plus, Trash, Copy, Loader2 } from "lucide-react";
import { getUserProfile, updateProfile } from "@/actions/user";
import { useToast } from "@/hooks/useToast";
import { QRCodeSVG } from "qrcode.react";

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

  return (
    <div className="flex-1 space-y-4 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <QrCode className="w-6 h-6 md:w-8 md:h-8 text-primary" />
            My UPI & QR
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your UPI IDs and share your receiving QR code.
          </p>
        </div>
      </div>

      <div className="bg-card rounded-none sm:rounded-2xl border-y sm:border-x sm:border-y shadow-sm p-4 md:p-6 space-y-6 -mx-2 sm:mx-0 mt-4 sm:mt-0">
        
        {/* UPI IDs Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold">My UPI IDs</h3>
              <p className="text-sm text-muted-foreground">Add your VPA/UPI IDs to generate receiving QR codes.</p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => setUpiIds([...upiIds, ""])} className="h-8">
              <Plus className="w-4 h-4 mr-1" /> Add
            </Button>
          </div>
          
          <div className="space-y-3">
            {upiIds.map((vpa, idx) => (
              <div key={idx} className="flex gap-2">
                <Input
                  placeholder="e.g. yourname@okicici"
                  value={vpa}
                  onChange={(e) => {
                    const newIds = [...upiIds];
                    newIds[idx] = e.target.value;
                    setUpiIds(newIds);
                  }}
                  className="w-full md:max-w-md"
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
            {upiIds.length === 0 && <p className="text-sm text-muted-foreground italic bg-secondary/30 p-3 rounded-lg border">No UPI IDs added yet. Click &quot;Add&quot; to start.</p>}
          </div>

          <Button className="mt-2" onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save UPI IDs"}
          </Button>
        </div>

        {/* QR Code Generation Section */}
        <div className="space-y-4 pt-6 border-t">
          <div>
            <h3 className="text-lg font-bold">My Receiving QR Code</h3>
            <p className="text-sm text-muted-foreground">Share this with friends or customers to receive payments.</p>
          </div>

          <div className="flex flex-col md:flex-row gap-8 items-start">
            {upiIds.filter(v => v.trim() !== "").length > 0 ? (
              <>
                <div className="space-y-2 w-full sm:max-w-xs">
                  <Label>Select UPI ID for QR Code</Label>
                  <select 
                    className="flex h-10 w-full items-center justify-between rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    value={selectedUpiForQr}
                    onChange={(e) => setSelectedUpiForQr(e.target.value)}
                  >
                    {upiIds.filter(v => v.trim() !== "").map((vpa, i) => (
                      <option key={i} value={vpa}>{vpa}</option>
                    ))}
                  </select>
                </div>

                {generatedUpiUrl && (
                  <div className="flex flex-col gap-2 w-full items-center md:items-start mt-4 md:mt-0">
                    <button 
                      type="button" 
                      onClick={() => setQrModalOpen(true)}
                      className="p-4 bg-white rounded-3xl shadow-sm border hover:shadow-md transition-all cursor-pointer relative group flex flex-col items-center gap-3"
                    >
                      <QRCodeSVG 
                        value={generatedUpiUrl} 
                        size={180} 
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
                      <span className="text-sm font-semibold text-primary">{selectedUpiForQr}</span>
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
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground italic bg-secondary/30 p-4 rounded-xl border w-full text-center">Add a UPI ID above and save to generate your QR code.</p>
            )}
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
