"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

function Dialog({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md animate-in fade-in zoom-in-95 rounded-xl bg-white p-6 shadow-xl duration-200">
        {React.Children.map(children, (child) => {
          if (!React.isValidElement(child)) {
            return child;
          }

          return React.cloneElement(child as React.ReactElement<{ onOpenChange?: (open: boolean) => void }>, {
            onOpenChange,
          });
        })}
      </div>
    </div>
  );
}

function DialogContent({
  className,
  onOpenChange,
  children,
}: React.ComponentProps<"div"> & { onOpenChange?: (open: boolean) => void }) {
  return (
    <div className={cn("relative", className)}>
      {children}
      {onOpenChange ? (
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="absolute right-0 top-0 rounded-md p-1 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
          aria-label="Close dialog"
        >
          <X className="size-5" />
        </button>
      ) : null}
    </div>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("mb-4 pr-8", className)} {...props} />;
}

function DialogTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return <h2 className={cn("text-xl font-semibold text-zinc-950", className)} {...props} />;
}

function DialogDescription({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn("mt-2 text-sm leading-6 text-zinc-600", className)} {...props} />;
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col-reverse gap-3 sm:flex-row sm:justify-end", className)} {...props} />;
}

export { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle };
