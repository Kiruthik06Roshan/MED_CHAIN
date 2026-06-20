"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

type SheetContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const SheetContext = React.createContext<SheetContextValue | undefined>(
  undefined,
);

function Sheet({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <SheetContext.Provider value={{ open, setOpen: onOpenChange }}>
      {children}
    </SheetContext.Provider>
  );
}

function SheetTrigger({ children }: { children: React.ReactElement }) {
  const context = React.useContext(SheetContext);
  return React.cloneElement(children, {
    onClick: () => context?.setOpen(true),
  });
}

function SheetContent({
  className,
  side = "left",
  children,
}: {
  className?: string;
  side?: "left" | "right";
  children: React.ReactNode;
}) {
  const context = React.useContext(SheetContext);

  if (!context?.open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50">
      <button
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        aria-label="Close sheet"
        onClick={() => context.setOpen(false)}
      />
      <aside
        className={cn(
          "absolute top-0 h-full w-80 border-white/10 bg-slate-900 text-white shadow-2xl transition-transform",
          side === "left" ? "left-0 border-r" : "right-0 border-l",
          className,
        )}
      >
        {children}
      </aside>
    </div>,
    document.body,
  );
}

function SheetHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 border-b border-white/10 p-6",
        className,
      )}
      {...props}
    />
  );
}

function SheetTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("text-xl font-semibold", className)} {...props} />;
}

function SheetDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-slate-400", className)} {...props} />;
}

function SheetFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("border-t border-white/10 p-6", className)} {...props} />
  );
}

export {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
};
