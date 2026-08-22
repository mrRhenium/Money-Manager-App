"use client";

import React, { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { useCurrency } from "@/hooks/useCurrency";

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

  useEffect(() => {
    // Detect iOS devices where intent links often don't work seamlessly
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setIsIOS(true);
    }
  }, []);

  // Build the UPI URI per standard specs
  const urlParams = new URLSearchParams({
    pa: payeeAddress,
    pn: payeeName,
    am: amount.toString(),
    cu: "INR",
    tn: transactionNote,
  });

  if (transactionRef) {
    urlParams.append("tr", transactionRef);
  }

  const upiUrl = `upi://pay?${urlParams.toString()}`;

  const handlePayClick = () => {
    // Attempt to open the UPI app intent
    window.location.href = upiUrl;
    // Show confirmation prompt since we can't get a webhook callback in browser
    setTimeout(() => {
      setShowConfirm(true);
    }, 2000);
  };

  return (
    <div className="flex flex-col items-center gap-6 p-6 border rounded-xl bg-card">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Pay {payeeName}</h3>
        <p className="text-2xl font-bold">{format(amount)}</p>
      </div>

      {isIOS ? (
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 bg-white rounded-xl shadow-sm">
            <QRCodeSVG value={upiUrl} size={200} level="M" />
          </div>
          <p className="text-sm text-muted-foreground text-center max-w-xs">
            Scan this QR code with any UPI app (GPay, PhonePe, Paytm) to complete the payment.
          </p>
        </div>
      ) : (
        <Button onClick={handlePayClick} className="w-full max-w-xs h-12 text-lg">
          Pay via UPI
        </Button>
      )}

      {showConfirm && !isIOS && (
        <div className="w-full mt-4 p-4 border rounded-lg bg-secondary/50 text-center space-y-3">
          <p className="font-medium">Did you complete the payment?</p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => setShowConfirm(false)}>No, cancel</Button>
            <Button onClick={() => onSuccess && onSuccess()}>Yes, mark as paid</Button>
          </div>
        </div>
      )}
      
      {isIOS && (
        <Button variant="outline" onClick={() => onSuccess && onSuccess()} className="w-full max-w-xs">
          I have completed the scan
        </Button>
      )}
    </div>
  );
}
