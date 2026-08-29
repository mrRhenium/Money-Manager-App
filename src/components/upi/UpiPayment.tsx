"use client";

import React, { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { useCurrency } from "@/hooks/useCurrency";

import { ALL_UPI_APPS, buildUpiDeepLink } from "@/lib/upiApps";
import { getUpiAppsConfig } from "@/actions/user";
import { Select } from "antd";
import { Smartphone } from "lucide-react";

interface UpiPaymentProps {
  payeeAddress: string; // pa
  payeeName: string; // pn
  amount: number; // am
  transactionRef?: string; // tr
  transactionNote?: string; // tn
  onSuccess?: () => void;
}

export function UpiPayment({
  payeeAddress,
  payeeName,
  amount,
  transactionRef,
  transactionNote = "Money Manager Expense",
  onSuccess,
}: UpiPaymentProps) {
  const { format } = useCurrency();
  const [isIOS, setIsIOS] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [upiApps, setUpiApps] = useState<any[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<string>("default");

  useEffect(() => {
    // Detect iOS devices
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setIsIOS(true);
    }

    getUpiAppsConfig().then(res => {
      setUpiApps(res.apps);
      if (res.defaultUpiApp) {
        setSelectedAppId(res.defaultUpiApp);
      }
    }).catch(console.error);
  }, []);

  const upiUrl = buildUpiDeepLink(selectedAppId, {
    pa: payeeAddress,
    pn: payeeName,
    am: amount.toString(),
    cu: "INR",
    tn: transactionNote,
    tr: transactionRef,
  });

  const handlePayClick = () => {
    // Attempt to open the UPI app intent
    window.location.href = upiUrl;
    // Show confirmation prompt since we can't get a webhook callback in browser
    setTimeout(() => {
      setShowConfirm(true);
    }, 2000);
  };

  const appsToRender = React.useMemo(() => {
    const list = upiApps.length > 0 ? upiApps : ALL_UPI_APPS;
    return [...list].sort((a, b) => {
      const aActive = a.isActive !== false;
      const bActive = b.isActive !== false;
      if (aActive && !bActive) return -1;
      if (!aActive && bActive) return 1;
      if (a.id === selectedAppId) return -1;
      if (b.id === selectedAppId) return 1;
      return 0;
    });
  }, [upiApps, selectedAppId]);

  const currentApp = appsToRender.find(a => a.id === selectedAppId) || ALL_UPI_APPS[0];

  return (
    <div className="flex flex-col items-center gap-5 p-6 border rounded-2xl bg-card shadow-sm max-w-sm mx-auto">
      <div className="text-center space-y-1">
        <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">UPI Payment</p>
        <h3 className="text-lg font-bold text-foreground truncate max-w-[280px]">{payeeName}</h3>
        <p className="text-2xl font-black text-primary">{format(amount)}</p>
        <p className="text-xs font-mono text-muted-foreground">{payeeAddress}</p>
      </div>

      {/* App Selector */}
      <div className="w-full space-y-1.5">
        <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <Smartphone className="w-3.5 h-3.5 text-primary" /> Select Payment App:
        </label>
        <Select
          value={selectedAppId}
          onChange={setSelectedAppId}
          className="w-full h-10"
          popupClassName="custom-scrollbar"
        >
          {appsToRender.map(app => (
            <Select.Option key={app.id} value={app.id}>
              <div className="flex items-center justify-between w-full py-0.5">
                <span className="font-semibold text-xs">{app.name}</span>
                <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                  app.isActive !== false ? "text-emerald-600 bg-emerald-500/10" : "text-muted-foreground bg-muted"
                }`}>
                  {app.isActive !== false ? "Active" : "Not in use"}
                </span>
              </div>
            </Select.Option>
          ))}
        </Select>
      </div>

      {isIOS ? (
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 bg-white rounded-xl shadow-sm border">
            <QRCodeSVG value={upiUrl} size={200} level="M" />
          </div>
          <p className="text-xs text-muted-foreground text-center max-w-xs">
            Scan this QR code with any UPI app ({currentApp.shortName}) to complete the payment.
          </p>
        </div>
      ) : (
        <Button onClick={handlePayClick} className="w-full h-11 text-sm font-bold shadow-sm">
          Pay with {currentApp.shortName}
        </Button>
      )}

      {showConfirm && !isIOS && (
        <div className="w-full mt-2 p-4 border rounded-xl bg-secondary/50 text-center space-y-3">
          <p className="font-semibold text-xs">Did you complete the payment?</p>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" size="sm" className="text-xs" onClick={() => setShowConfirm(false)}>No, cancel</Button>
            <Button size="sm" className="text-xs font-bold" onClick={() => onSuccess && onSuccess()}>Yes, mark as paid</Button>
          </div>
        </div>
      )}
      
      {isIOS && (
        <Button variant="outline" onClick={() => onSuccess && onSuccess()} className="w-full">
          I have completed the scan
        </Button>
      )}
    </div>
  );
}
