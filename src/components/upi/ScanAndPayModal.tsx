"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { createTransaction, confirmTransaction } from "@/actions/transaction";
import { getCurrentDate } from "@/lib/dateTimeHelper";
import { getCategories } from "@/actions/category";
import { getAccounts } from "@/actions/account";
import { getPeople, savePersonVpa } from "@/actions/person";
import { getUpiAppsConfig } from "@/actions/user";
import { useToast } from "@/hooks/useToast";
import { Camera, AlertCircle, CheckCircle, Smartphone, Loader2, Landmark, Tag, Users, Star, ExternalLink, Sparkles } from "lucide-react";
import { Select, Spin } from "antd";
import { formatIndianNumber, parseIndianNumber } from "@/lib/numberHelper";
import { useCurrency } from "@/hooks/useCurrency";
import { ALL_UPI_APPS, DEFAULT_ACTIVE_APP_IDS, buildUpiDeepLink, UpiAppInfo } from "@/lib/upiApps";
import { UpiAppLogo } from "@/components/upi/UpiAppLogo";
import Link from "next/link";

interface ScanAndPayModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triggerButton?: React.ReactNode;
}

export function ScanAndPayModal({ open, onOpenChange }: ScanAndPayModalProps) {
  const { toast } = useToast();
  const { format, currencyCode } = useCurrency();
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
  const [people, setPeople] = useState<any[]>([]);
  const [upiApps, setUpiApps] = useState<any[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<string>("default");
  
  // Quick Select State
  const [selectedPersonId, setSelectedPersonId] = useState("");
  type RelationType = "Friend" | "Family" | "Colleague" | "Merchant" | "Shopkeeper" | "Other";
  const [savePayeeRelation, setSavePayeeRelation] = useState<RelationType>("Merchant");

  // States
  const [loading, setLoading] = useState(false);
  const [confirmingStatus, setConfirmingStatus] = useState<"completed" | "cancelled" | "pending" | null>(null);
  const [createdTxnId, setCreatedTxnId] = useState<string | null>(null);
  const [generatedUpiUrl, setGeneratedUpiUrl] = useState("");
  const [isIOS, setIsIOS] = useState(false);

  // Sort Accounts with Active & Liquid accounts (Bank, Wallet, Cash) on top
  const sortedAccounts = useMemo(() => {
    return [...accounts].sort((a, b) => {
      const aIsActive = a.isActive !== false && a.status !== "inactive";
      const bIsActive = b.isActive !== false && b.status !== "inactive";
      if (aIsActive && !bIsActive) return -1;
      if (!aIsActive && bIsActive) return 1;
      return (b.balance || 0) - (a.balance || 0);
    });
  }, [accounts]);

  // Sort UPI Apps with Active Apps on top, default app first, and inactive apps at bottom
  const sortedUpiApps = useMemo(() => {
    const list = upiApps.length > 0 ? upiApps : ALL_UPI_APPS.map(a => ({
      ...a,
      isActive: DEFAULT_ACTIVE_APP_IDS.includes(a.id),
      isDefault: a.id === "default"
    }));

    return [...list].sort((a, b) => {
      const aActive = a.isActive !== false;
      const bActive = b.isActive !== false;
      
      // 1. Active apps on top of inactive apps
      if (aActive && !bActive) return -1;
      if (!aActive && bActive) return 1;

      // 2. If both are active, selected or default app first
      if (a.id === selectedAppId) return -1;
      if (b.id === selectedAppId) return 1;
      if (a.isDefault) return -1;
      if (b.isDefault) return 1;

      return 0;
    });
  }, [upiApps, selectedAppId]);

  // Load Categories, Accounts & UPI Apps Preferences
  useEffect(() => {
    if (open) {
      getCategories().then(setCategories).catch(console.error);
      getPeople().then(setPeople).catch(console.error);
      getUpiAppsConfig().then(res => {
        setUpiApps(res.apps);
        if (res.defaultUpiApp) {
          setSelectedAppId(res.defaultUpiApp);
        }
      }).catch(console.error);
      getAccounts().then(accs => {
        setAccounts(accs);
        // Default to first active bank/wallet/cash account if available
        const defaultAcc = accs.find((a: any) => (a.isActive !== false && a.status !== "inactive") && (a.type === "bank" || a.type === "wallet" || a.type === "cash")) || accs[0];
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
  function parseUpiUrl(url: string) {
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

  function handleScanSuccess(rawText: string) {
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

    // Auto-detect if payee already exists to preload relation, otherwise default to Merchant
    const existingPerson = people.find(p => (p.vpas && p.vpas.includes(parsed.pa)) || (p.name && p.name.toLowerCase() === (parsed.pn || "").toLowerCase()));
    if (existingPerson && existingPerson.relation) {
      setSavePayeeRelation(existingPerson.relation as RelationType);
    } else {
      setSavePayeeRelation("Merchant");
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

    // Auto-detect existing person relation or default to Merchant
    const existingPerson = people.find(p => (p.vpas && p.vpas.includes(vpa)) || (p.name && p.name.toLowerCase() === payeeName.toLowerCase()));
    if (existingPerson && existingPerson.relation) {
      setSavePayeeRelation(existingPerson.relation as RelationType);
    } else {
      setSavePayeeRelation("Merchant");
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

      // Save payee VPA with user-selected person type
      await savePersonVpa(payeeName, vpa, savePayeeRelation);

      // Create transaction immediately with awaiting_confirmation status
      const txnRes = await createTransaction({
        type: "expense",
        amount: parsedAmount,
        date: getCurrentDate().toISOString(),
        accountId,
        paymentMode: "bank", // standard UPI goes through bank account
        categoryId,
        note: note || "UPI Payment",
        paymentSource: "upi_scan",
        status: "awaiting_confirmation",
        upiRef: vpa,
        upiPayeeName: payeeName,
        upiPayeeVpa: vpa
      });

      if (txnRes && !txnRes.success) {
        toast.error(txnRes.error || "Failed to initiate payment");
        setLoading(false);
        return;
      }

      const txn = txnRes.data || txnRes;
      setCreatedTxnId(txn._id);

      // Build targeted UPI URL for the chosen app
      const upiUrl = buildUpiDeepLink(selectedAppId, {
        pa: vpa,
        pn: payeeName,
        am: parsedAmount.toString(),
        cu: "INR",
        tn: note || "Money Manager Scan & Pay"
      });
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
    const txnId = createdTxnId;
    
    // Close modal and reset state immediately
    onOpenChange(false);
    resetModal();

    if (!txnId) return;

    try {
      setLoading(true);
      setConfirmingStatus(status);

      // Trigger transaction confirmation on the backend in the background
      await confirmTransaction(txnId, status);

      if (status === "completed") {
        toast.success("Payment marked as successful!");
      } else if (status === "cancelled") {
        toast.warning("Payment cancelled.");
      } else {
        toast.info("Transaction kept pending for later confirmation.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to confirm transaction status");
    } finally {
      setLoading(false);
      setConfirmingStatus(null);
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
    setSelectedPersonId("");
    setSavePayeeRelation("Merchant");
  };

  return (
    <Dialog 
      open={open} 
      onOpenChange={(val) => {
        resetModal();
        onOpenChange(val);
      }}
    >
      <DialogContent initialFocus={false} size="md">
        {step !== "confirmation_dialog" && step !== "ios_relay" && (
          <DialogHeader>
            <DialogTitle>
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Camera className="w-5 h-5" />
              </div>
              <span>UPI Scan & Pay</span>
            </DialogTitle>
            <DialogDescription>
              Scan any merchant QR code or enter UPI ID manually to pay.
            </DialogDescription>
          </DialogHeader>
        )}
        <DialogBody className="space-y-4">

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
                <div className="space-y-2 pb-2 border-b">
                  <Label>Quick Select Saved Contact</Label>
                  <Select
                    showSearch
                    placeholder="Search by name or VPA"
                    className="w-full h-10"
                    optionFilterProp="label"
                    value={selectedPersonId || undefined}
                    onChange={(val) => {
                      setSelectedPersonId(val);
                      const person = people.find(p => p._id === val);
                      if (person) {
                        setPayeeName(person.name);
                        if (person.relation) {
                          setSavePayeeRelation(person.relation as RelationType);
                        }
                        if (person.vpas && person.vpas.length === 1) {
                          setVpa(person.vpas[0]);
                        } else {
                          setVpa("");
                        }
                      }
                    }}
                    options={people.map(p => ({
                      label: `${p.name} (${p.relation})`,
                      value: p._id,
                    }))}
                  />
                  
                  {selectedPersonId && people.find(p => p._id === selectedPersonId)?.vpas?.length > 1 && (
                    <div className="mt-3">
                      <Label className="text-xs text-muted-foreground mb-1 block">Select which UPI ID to pay:</Label>
                      <Select
                        className="w-full h-9"
                        placeholder="Select a VPA"
                        value={vpa || undefined}
                        onChange={setVpa}
                        options={people.find(p => p._id === selectedPersonId)?.vpas.map((v: string) => ({
                          label: v,
                          value: v
                        }))}
                      />
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="manual-vpa">UPI VPA (Virtual Payment Address)</Label>
                  <Input
                    id="manual-vpa"
                    placeholder="e.g. merchant@ybl, recipient@okaxis"
                    value={vpa}
                    onChange={e => {
                      setVpa(e.target.value);
                      setSelectedPersonId("");
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manual-name">Recipient Name (Optional)</Label>
                  <Input
                    id="manual-name"
                    value={payeeName}
                    onChange={e => {
                      setPayeeName(e.target.value);
                      setSelectedPersonId("");
                    }}
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
                <Label htmlFor="amount">Amount ({currencyCode})</Label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-2.5 font-bold text-muted-foreground/70 pointer-events-none select-none">{currencyCode}</span>
                  <Input
                    id="amount"
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={amount}
                    onChange={e => setAmount(formatIndianNumber(e.target.value))}
                    disabled={isAmountReadOnly}
                    className="pl-12 font-bold text-lg placeholder:font-normal placeholder:text-muted-foreground/35 dark:placeholder:text-muted-foreground/30"
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
                  options={sortedAccounts.map(a => {
                    const isAccActive = a.isActive !== false && a.status !== "inactive";
                    return {
                      value: a._id,
                      label: `${a.name} (${format(a.balance)})${!isAccActive ? " [Inactive]" : ""}`
                    };
                  })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

                <div className="flex flex-col gap-1">
                  <Label>Person Type</Label>
                  <Select
                    value={savePayeeRelation}
                    onChange={setSavePayeeRelation}
                    className="w-full h-10 mt-1"
                    options={[
                      { label: "Merchant", value: "Merchant" },
                      { label: "Shopkeeper", value: "Shopkeeper" },
                      { label: "Friend", value: "Friend" },
                      { label: "Family", value: "Family" },
                      { label: "Colleague", value: "Colleague" },
                      { label: "Other", value: "Other" },
                    ]}
                  />
                </div>
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

              {/* UPI App Selection */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-primary" />
                    Open with Payment App
                  </Label>
                  <Link 
                    href="/settings?tab=payment_apps" 
                    onClick={() => onOpenChange(false)}
                    className="text-[11px] text-primary hover:underline flex items-center gap-0.5"
                  >
                    <span>Manage Apps</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </Link>
                </div>

                <Select
                  value={selectedAppId}
                  onChange={setSelectedAppId}
                  className="w-full h-10"
                  popupClassName="custom-scrollbar"
                  optionLabelProp="label"
                >
                  {sortedUpiApps.map(app => {
                    const isActive = app.isActive ?? true;
                    return (
                      <Select.Option 
                        key={app.id} 
                        value={app.id}
                        label={
                          <div className="flex items-center justify-between w-full h-full gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <UpiAppLogo appId={app.id} size="sm" className="w-5 h-5 rounded-md shrink-0" />
                              <span className="font-semibold text-xs text-foreground truncate leading-none">{app.name}</span>
                            </div>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ml-auto leading-none ${
                              isActive 
                                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30" 
                                : "bg-muted text-muted-foreground border border-border/40"
                            }`}>
                              {isActive ? "Active" : "Not in use"}
                            </span>
                          </div>
                        }
                      >
                        <div className="flex items-center justify-between w-full py-1">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <UpiAppLogo appId={app.id} size="md" className="w-7 h-7 rounded-lg shrink-0" />
                            <div className="min-w-0">
                              <p className="font-bold text-xs text-foreground leading-tight truncate">{app.name}</p>
                              <p className="text-[10px] text-muted-foreground">{app.shortName}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                              isActive 
                                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30" 
                                : "bg-muted text-muted-foreground border border-border/40"
                            }`}>
                              {isActive ? "Active (In Use)" : "Not in use"}
                            </span>
                          </div>
                        </div>
                      </Select.Option>
                    );
                  })}
                </Select>
              </div>

              <div className="text-[10px] text-muted-foreground italic text-center mt-2">
                This UPI ID will be automatically saved to your Payee Book for quicker access next time.
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="ghost" className="flex-1" onClick={() => setStep("scan")} disabled={loading}>
                Back
              </Button>
              <Button className="flex-1 font-bold" onClick={handleProceedToPay} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Pay with {sortedUpiApps.find(a => a.id === selectedAppId)?.shortName || "UPI"}
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
                <p className="text-muted-foreground text-sm leading-relaxed max-w-sm text-center">
                  Open GPay, PhonePe, or Paytm on another device and scan this QR to pay <span className="font-bold text-primary">{format(Number(amount))}</span> to <span className="font-bold">{payeeName}</span>.
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
              <p className="text-muted-foreground text-sm leading-relaxed max-w-sm text-center">
                Did you complete the payment of <span className="font-bold text-primary">{format(Number(amount))}</span> to <span className="font-bold">{payeeName}</span>?
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Button
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold"
                onClick={() => handleFinalConfirm("completed")}
                disabled={loading}
              >
                {confirmingStatus === "completed" && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Yes, Paid Successfully
              </Button>
              <Button
                variant="destructive"
                className="w-full font-bold"
                onClick={() => handleFinalConfirm("cancelled")}
                disabled={loading}
              >
                {confirmingStatus === "cancelled" && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                No, Failed / Cancelled
              </Button>
              <Button
                variant="secondary"
                className="w-full font-bold"
                onClick={() => handleFinalConfirm("pending")}
                disabled={loading}
              >
                {confirmingStatus === "pending" && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Not sure yet / Ask me later
              </Button>
            </div>
          </div>
        )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
