"use client";

import React, { useState, useEffect, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { createTransaction, confirmTransaction } from "@/actions/transaction";
import { getCategories } from "@/actions/category";
import { getAccounts } from "@/actions/account";
import { savePersonVpa } from "@/actions/person";
import { useToast } from "@/hooks/useToast";
import { Camera, AlertCircle, CheckCircle, Smartphone, Loader2, Landmark, Tag } from "lucide-react";
import { Select } from "antd";
import { formatIndianNumber, parseIndianNumber } from "@/lib/numberHelper";

interface ScanAndPayModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triggerButton?: React.ReactNode;
}

export function ScanAndPayModal({ open, onOpenChange }: ScanAndPayModalProps) {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<"scan" | "confirm" | "ios_relay" | "confirmation_dialog">("scan");
  const [scanning, setScanning] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [manualEntry, setManualEntry] = useState(false);

  // Form Fields
  const [vpa, setVpa] = useState("");
  const [payeeName, setPayeeName] = useState("");
  const [amount, setAmount] = useState("");
  const [isAmountReadOnly, setIsAmountReadOnly] = useState(false);
  const [note, setNote] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [savePayee, setSavePayee] = useState(true);

  // Options loaded from DB
  const [categories, setCategories] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);

  // States
  const [loading, setLoading] = useState(false);
  const [createdTxnId, setCreatedTxnId] = useState<string | null>(null);
  const [generatedUpiUrl, setGeneratedUpiUrl] = useState("");
  const [isIOS, setIsIOS] = useState(false);

  // Load Categories & Accounts
  useEffect(() => {
    if (open) {
      getCategories().then(setCategories).catch(console.error);
      getAccounts().then(accs => {
        setAccounts(accs);
        // Default to first bank/wallet/cash account if available
        const defaultAcc = accs.find((a: any) => a.type === "bank" || a.type === "wallet" || a.type === "cash") || accs[0];
        if (defaultAcc) {
          setAccountId(defaultAcc._id);
        }
      }).catch(console.error);

      // Detect iOS PWA
      const userAgent = window.navigator.userAgent.toLowerCase();
      if (/iphone|ipad|ipod/.test(userAgent)) {
        setIsIOS(true);
      }
    }
  }, [open]);

  // QR Scanner Initialization
  useEffect(() => {
    if (!open || step !== "scan" || manualEntry) {
      setScanning(false);
      return;
    }

    setScanning(true);
    let qrScanner: any;

    // Check camera permission
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
      .then((stream) => {
        setHasCameraPermission(true);
        stream.getTracks().forEach(track => track.stop()); // release stream immediately

        // Lazy import QrScanner
        import("qr-scanner").then(({ default: QrScannerClass }) => {
          if (!videoRef.current) return;
          qrScanner = new QrScannerClass(
            videoRef.current,
            (result) => {
              handleScanSuccess(result.data);
            },
            {
              onDecodeError: () => { },
              highlightScanRegion: true,
              highlightCodeOutline: true,
            }
          );
          qrScanner.start().catch((err: any) => {
            console.error("Scanner start failed", err);
            setHasCameraPermission(false);
          });
        });
      })
      .catch((err) => {
        console.error("Camera permission denied", err);
        setHasCameraPermission(false);
        setManualEntry(true);
      });

    return () => {
      setScanning(false);
      if (qrScanner) {
        qrScanner.destroy();
      }
    };
  }, [open, step, manualEntry]);

  // Parse UPI URL
  const parseUpiUrl = (url: string) => {
    if (!url.startsWith("upi://pay")) {
      return null;
    }
    try {
      const searchString = url.replace(/^upi:\/\/pay\??/, "");
      const params = new URLSearchParams(searchString);
      const pa = params.get("pa");
      const pn = params.get("pn");
      const am = params.get("am");
      const tn = params.get("tn");
      const mc = params.get("mc");

      if (!pa) return null;

      return {
        pa,
        pn: pn || "Unknown Payee",
        am: am ? parseFloat(am) : null,
        tn: tn || "",
        mc: mc || "",
      };
    } catch (e) {
      return null;
    }
  };

  const handleScanSuccess = (rawText: string) => {
    const parsed = parseUpiUrl(rawText);
    if (!parsed) {
      toast.error("This doesn't look like a valid UPI QR code");
      return;
    }

    setVpa(parsed.pa);
    setPayeeName(parsed.pn);
    setNote(parsed.tn);

    if (parsed.am !== null) {
      setAmount(formatIndianNumber(parsed.am));
      setIsAmountReadOnly(true);
    } else {
      setAmount("");
      setIsAmountReadOnly(false);
    }

    // Attempt to set default "Uncategorized" category
    const uncategorized = categories.find(c => c.name.toLowerCase() === "uncategorized" || c.name.toLowerCase() === "others");
    if (uncategorized) {
      setCategoryId(uncategorized._id);
    } else if (categories.length > 0) {
      setCategoryId(categories[0]._id);
    }

    toast.success("QR Code parsed successfully!");
    setStep("confirm");
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    import("qr-scanner").then(({ default: QrScannerClass }) => {
      QrScannerClass.scanImage(file)
        .then((result) => {
          const rawText = typeof result === "string" ? result : (result as any).data;
          handleScanSuccess(rawText);
        })
        .catch((err) => {
          console.error("QR Code scanning from image failed", err);
          toast.error("No valid UPI QR code found in this image. Please try another one.");
        });
    });
  };

  // Manual Trigger for scan parsing (when typed or fallback)
  const handleManualProceed = () => {
    if (!vpa || !vpa.includes("@")) {
      toast.error("Please enter a valid UPI VPA (e.g. name@bank)");
      return;
    }
    if (!payeeName) {
      setPayeeName("Manual Payee");
    }

    const uncategorized = categories.find(c => c.name.toLowerCase() === "uncategorized" || c.name.toLowerCase() === "others");
    if (uncategorized) {
      setCategoryId(uncategorized._id);
    } else if (categories.length > 0) {
      setCategoryId(categories[0]._id);
    }

    setStep("confirm");
  };

  // Submit and Create Pending Transaction
  const handleProceedToPay = async () => {
    const parsedAmount = parseIndianNumber(amount);
    if (!amount || parsedAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (!categoryId) {
      toast.error("Please select a category");
      return;
    }
    if (!accountId) {
      toast.error("Please select an account to pay from");
      return;
    }

    try {
      setLoading(true);

      // Save payee VPA if toggle is active
      if (savePayee) {
        await savePersonVpa(payeeName, vpa);
      }

      // Create transaction immediately with awaiting_confirmation status
      const txn = await createTransaction({
        type: "expense",
        amount: parsedAmount,
        date: new Date().toISOString(),
        accountId,
        paymentMode: "bank", // standard UPI goes through bank account
        categoryId,
        note: note ? `${note} (to ${payeeName} - ${vpa})` : `UPI Payment to ${payeeName} (${vpa})`,
        paymentSource: "upi_scan",
        status: "awaiting_confirmation",
        upiRef: vpa
      });

      setCreatedTxnId(txn._id);

      // Build standard UPI URL
      const upiParams = new URLSearchParams({
        pa: vpa,
        pn: payeeName,
        am: parsedAmount.toString(),
        cu: "INR",
        tn: note || "Money Manager Scan & Pay"
      });
      const upiUrl = `upi://pay?${upiParams.toString()}`;
      setGeneratedUpiUrl(upiUrl);

      if (isIOS) {
        // Direct redirects don't work reliably inside iOS PWA / Safari PWA
        // Show dynamic QR code relay screen
        setStep("ios_relay");
      } else {
        // Trigger intent immediately for Android / Standard devices
        window.location.href = upiUrl;

        // Brief timeout then proceed to mandatory confirmation
        setTimeout(() => {
          setStep("confirmation_dialog");
        }, 1500);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to initiate payment");
    } finally {
      setLoading(false);
    }
  };

  // Final confirmation status handler
  const handleFinalConfirm = async (status: "completed" | "cancelled" | "pending") => {
    if (!createdTxnId) return;

    try {
      setLoading(true);
      await confirmTransaction(createdTxnId, status);

      if (status === "completed") {
        toast.success("Payment marked as successful!");
      } else if (status === "cancelled") {
        toast.warning("Payment cancelled.");
      } else {
        toast.info("Transaction kept pending for later confirmation.");
      }

      // Reset state and close modal
      resetModal();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to confirm transaction status");
    } finally {
      setLoading(false);
    }
  };

  const resetModal = () => {
    setStep("scan");
    setManualEntry(false);
    setVpa("");
    setPayeeName("");
    setAmount("");
    setIsAmountReadOnly(false);
    setNote("");
    setCategoryId("");
    setCreatedTxnId(null);
    setGeneratedUpiUrl("");
  };

  return (
    <Dialog 
      open={open} 
      onOpenChange={
        step === "confirmation_dialog" 
          ? undefined 
          : (val) => {
              resetModal();
              onOpenChange(val);
            }
      }
    >
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto p-6 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary font-bold text-lg">
            <Camera className="w-5 h-5" />
            <span>UPI Scan & Pay</span>
          </DialogTitle>
          <DialogDescription>
            Scan any merchant QR code or enter UPI ID manually to pay.
          </DialogDescription>
        </DialogHeader>

        {/* STEP 1: SCAN VIEW */}
        {step === "scan" && (
          <div className="space-y-4">
            {!manualEntry ? (
              <div className="flex flex-col items-center gap-4">
                <div className="relative w-full aspect-square max-w-[280px] bg-black rounded-2xl overflow-hidden border-2 border-primary/20 shadow-md">
                  <video ref={videoRef} className="w-full h-full object-cover" />
                  <div className="absolute inset-4 border-2 border-dashed border-white/50 rounded-xl pointer-events-none animate-pulse" />
                </div>
                {hasCameraPermission === false && (
                  <p className="text-xs text-red-500 text-center flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" /> Camera access denied or unavailable.
                  </p>
                )}
                <div className="flex gap-2 w-full max-w-[280px]">
                  <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => setManualEntry(true)}>
                    Enter UPI ID
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => fileInputRef.current?.click()}>
                    From Gallery
                  </Button>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="manual-vpa">UPI VPA (Virtual Payment Address)</Label>
                  <Input
                    id="manual-vpa"
                    placeholder="e.g. merchant@ybl, recipient@okaxis"
                    value={vpa}
                    onChange={e => setVpa(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manual-name">Recipient Name (Optional)</Label>
                  <Input
                    id="manual-name"
                    value={payeeName}
                    onChange={e => setPayeeName(e.target.value)}
                  />
                </div>
                <div className="flex gap-3">
                  <Button variant="ghost" className="flex-1" onClick={() => setManualEntry(false)}>
                    Use Camera
                  </Button>
                  <Button className="flex-1" onClick={handleManualProceed}>
                    Proceed
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: CONFIRMATION & DETAILS INPUT */}
        {step === "confirm" && (
          <div className="space-y-4">
            <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
              <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Recipient Details</p>
              <h3 className="font-bold text-foreground mt-1 text-base">{payeeName}</h3>
              <p className="text-sm font-mono text-muted-foreground">{vpa}</p>
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor="amount">Amount (₹)</Label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-2.5 font-bold text-muted-foreground">₹</span>
                  <Input
                    id="amount"
                    type="text"
                    placeholder="0.00"
                    value={amount}
                    onChange={e => setAmount(formatIndianNumber(e.target.value))}
                    disabled={isAmountReadOnly}
                    className="pl-7 font-bold text-lg"
                  />
                </div>
                {isAmountReadOnly && (
                  <p className="text-[10px] text-emerald-500 mt-1 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Amount locked by merchant.
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <Label>Debit From Account</Label>
                <Select
                  value={accountId}
                  onChange={setAccountId}
                  className="w-full h-10 mt-1"
                  options={accounts.map(a => ({
                    label: `${a.name} (₹${a.balance.toLocaleString('en-IN')})`,
                    value: a._id
                  }))}
                />
              </div>

              <div className="flex flex-col gap-1">
                <Label>Category</Label>
                <Select
                  value={categoryId}
                  onChange={setCategoryId}
                  className="w-full h-10 mt-1"
                  options={categories.map(c => ({
                    label: c.name,
                    value: c._id
                  }))}
                />
              </div>

              <div>
                <Label htmlFor="note">Transaction Note (Optional)</Label>
                <Input
                  id="note"
                  placeholder="e.g. Grocery dinner, cab fare"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg border mt-2">
                <span className="text-xs font-semibold text-muted-foreground">Save to Payee Book</span>
                <input
                  type="checkbox"
                  checked={savePayee}
                  onChange={e => setSavePayee(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 accent-primary"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="ghost" className="flex-1" onClick={() => setStep("scan")} disabled={loading}>
                Back
              </Button>
              <Button className="flex-1" onClick={handleProceedToPay} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Pay Now
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: iOS PWA DYNAMIC QR RELAY */}
        {step === "ios_relay" && (
          <div className="space-y-4 text-center">
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="p-4 bg-white rounded-2xl shadow-md border">
                <QRCodeSVG value={generatedUpiUrl} size={200} level="M" />
              </div>
              <div>
                <h4 className="font-bold text-lg text-foreground">Scan with UPI App</h4>
                <p className="text-xs text-muted-foreground max-w-xs mt-1">
                  Open GPay, PhonePe, or Paytm on another device and scan this QR to pay <span className="font-bold text-primary">₹{amount}</span> to <span className="font-bold">{payeeName}</span>.
                </p>
              </div>
            </div>
            <Button className="w-full" onClick={() => setStep("confirmation_dialog")} disabled={loading}>
              Done Scanning, Next
            </Button>
          </div>
        )}

        {/* STEP 4: MANDATORY CONFIRMATION DIALOG */}
        {step === "confirmation_dialog" && (
          <div className="space-y-4 py-2">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center animate-bounce">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-foreground">Confirm UPI Payment</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Did you complete the payment of <span className="font-bold text-primary">₹{amount}</span> to <span className="font-bold">{payeeName}</span>?
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Button
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold"
                onClick={() => handleFinalConfirm("completed")}
                disabled={loading}
              >
                Yes, Paid Successfully
              </Button>
              <Button
                variant="destructive"
                className="w-full font-bold"
                onClick={() => handleFinalConfirm("cancelled")}
                disabled={loading}
              >
                No, Failed / Cancelled
              </Button>
              <Button
                variant="secondary"
                className="w-full font-bold"
                onClick={() => handleFinalConfirm("pending")}
                disabled={loading}
              >
                Not sure yet / Ask me later
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
