"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
  DialogTrigger,
  type ModalSize,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export interface CommonModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  size?: ModalSize;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  headerClassName?: string;
  footerClassName?: string;
  showCloseButton?: boolean;
}

/**
 * CommonModal: Standardized portal-wide modal wrapper.
 * Guarantees:
 * 1. Static/sticky Header at the top (title, subtitle, icon, close button).
 * 2. Static/sticky Footer at the bottom (buttons, actions).
 * 3. Independent scrollable content body in the middle.
 * 4. Standardized cross-device responsiveness (mobile safe-margin, desktop bounds).
 */
export function CommonModal({
  open,
  onOpenChange,
  trigger,
  title,
  subtitle,
  description,
  icon,
  size = "md",
  children,
  footer,
  className,
  bodyClassName,
  headerClassName,
  footerClassName,
  showCloseButton = true,
}: CommonModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger render={trigger as React.ReactElement} />}
      <DialogContent size={size} showCloseButton={showCloseButton} className={className}>
        <DialogHeader className={headerClassName}>
          <DialogTitle>
            {icon && (
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                {icon}
              </div>
            )}
            <span className="truncate">{title}</span>
          </DialogTitle>
          {(subtitle || description) && (
            <DialogDescription>
              {subtitle || description}
            </DialogDescription>
          )}
        </DialogHeader>

        <DialogBody className={bodyClassName}>
          {children}
        </DialogBody>

        {footer && (
          <DialogFooter className={footerClassName}>
            {footer}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
