"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { XIcon } from "lucide-react"

/**
 * Centralized Modal Design Tokens
 * Change properties here once, and they will cascade across every modal on the portal.
 */
export const MODAL_TOKENS = {
  size: {
    sm: "sm:max-w-md w-full",               // ~448px (Delete alerts, simple confirms)
    md: "sm:max-w-xl w-full",               // ~576px (Standard forms: Account, Person, Category)
    lg: "sm:max-w-2xl lg:max-w-3xl w-full", // ~672px - 768px (Complex forms: Transaction, Bill, Loan)
    xl: "sm:max-w-4xl w-full",               // ~896px (History, Audit viewer, Upcoming dues)
    full: "sm:max-w-5xl w-full",            // ~1024px (Large dashboards)
  },
  height: "max-h-[92vh] sm:max-h-[85vh] flex flex-col",
  header: "shrink-0 px-4 sm:px-6 py-3.5 sm:py-4 border-b border-border/60 bg-popover sticky top-0 z-10 flex items-center justify-between",
  title: "text-[length:var(--font-size-modal-title)] font-bold tracking-tight text-foreground flex items-center gap-2",
  description: "text-[length:var(--font-size-modal-desc)] text-muted-foreground mt-0.5",
  iconBadge: "w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0",
  body: "flex-1 overflow-y-auto overflow-x-hidden min-h-0 px-4 sm:px-6 py-3.5 sm:py-4 overscroll-contain space-y-4 text-[length:var(--font-size-modal-body)]",
  footer: "shrink-0 px-4 sm:px-6 py-3 sm:py-3.5 border-t border-border/60 bg-muted/30 sticky bottom-0 z-10 flex items-center justify-end gap-2.5",
  field: {
    height: "h-10",
    fontSize: "text-[length:var(--font-size-modal-input)]",
    labelFontSize: "text-[length:var(--font-size-modal-label)] font-semibold text-foreground/80",
    buttonHeight: "h-9 px-4 text-[length:var(--font-size-modal-btn)] font-semibold shadow-xs",
  }
}

export type ModalSize = keyof typeof MODAL_TOKENS.size

function Dialog({ ...props }: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({ ...props }: DialogPrimitive.Portal.Props) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({ ...props }: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 isolate z-50 bg-black/50 duration-100 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
        className
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  size,
  ...props
}: DialogPrimitive.Popup.Props & {
  showCloseButton?: boolean
  size?: ModalSize
}) {
  const sizeClass = size ? MODAL_TOKENS.size[size] : "sm:max-w-lg w-full"

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Popup
        data-slot="dialog-content"
        className={cn(
          "fixed top-1/2 left-1/2 z-50 flex flex-col w-full max-w-[calc(100%-1.5rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-popover text-sm text-popover-foreground ring-1 ring-foreground/10 duration-100 outline-none shadow-2xl overflow-hidden",
          MODAL_TOKENS.height,
          sizeClass,
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            render={
              <Button
                variant="ghost"
                className="absolute top-3.5 sm:top-4 right-4 sm:right-5 bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground rounded-full w-8 h-8 p-0 shrink-0 z-20 transition-colors"
                size="icon-sm"
              />
            }
          >
            <XIcon className="w-4 h-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Popup>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn(
        "shrink-0 px-5 sm:px-6 py-3.5 sm:py-4 border-b border-border/60 bg-popover sticky top-0 z-10 flex flex-col gap-1 pr-12 sm:pr-14",
        className
      )}
      {...props}
    />
  )
}

function DialogBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-body"
      className={cn(
        "flex-1 overflow-y-auto min-h-0 px-5 sm:px-6 py-4 overscroll-contain space-y-4 text-[length:var(--font-size-modal-body)] text-foreground",
        // Scoped cascading tokens for all standard inputs inside any modal:
        "[&_input]:h-10 [&_input]:text-[length:var(--font-size-modal-input)]",
        "[&_textarea]:text-[length:var(--font-size-modal-input)]",
        "[&_.ant-select]:!min-h-[40px] [&_.ant-select]:!h-10 [&_.ant-select]:!flex [&_.ant-select]:!items-center [&_.ant-select]:!text-[length:var(--font-size-modal-input)]",
        "[&_.ant-select-content]:!flex [&_.ant-select-content]:!items-center [&_.ant-select-content]:!leading-normal",
        "[&_.ant-select-placeholder]:!flex [&_.ant-select-placeholder]:!items-center [&_.ant-select-placeholder]:!leading-normal",
        "[&_.ant-select-suffix]:!flex [&_.ant-select-suffix]:!items-center",
        "[&_.ant-select-selector]:!min-h-[40px] [&_.ant-select-selector]:!flex [&_.ant-select-selector]:!items-center [&_.ant-select-selector]:!text-[length:var(--font-size-modal-input)]",
        "[&_.ant-select-selection-item]:!flex [&_.ant-select-selection-item]:!items-center [&_.ant-select-selection-item]:!top-auto [&_.ant-select-selection-item]:!h-full [&_.ant-select-selection-item]:!leading-normal",
        "[&_.ant-select-selection-placeholder]:!flex [&_.ant-select-selection-placeholder]:!items-center [&_.ant-select-selection-placeholder]:!top-auto [&_.ant-select-selection-placeholder]:!h-full [&_.ant-select-selection-placeholder]:!leading-normal",
        "[&_label]:text-[length:var(--font-size-modal-label)] [&_label]:font-semibold [&_label]:text-foreground/85",
        className
      )}
      {...props}
    />
  )
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "shrink-0 px-4 sm:px-6 py-3 sm:py-3.5 border-t border-border/60 bg-muted/30 sticky bottom-0 z-10 flex max-[299px]:flex-col-reverse flex-row max-[299px]:items-stretch items-center justify-end gap-2 sm:gap-2.5 text-[length:var(--font-size-modal-btn)]",
        className
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close render={<Button variant="outline" className="h-9 px-4 text-[length:var(--font-size-modal-btn)]" />}>
          Close
        </DialogPrimitive.Close>
      )}
    </div>
  )
}

function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn(
        "text-[length:var(--font-size-modal-title)] font-bold tracking-tight text-foreground flex items-center gap-2",
        className
      )}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        "text-[length:var(--font-size-modal-desc)] text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
}
