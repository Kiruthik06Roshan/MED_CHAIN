"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const SelectContext = React.createContext<
  { value?: string; onValueChange?: (value: string) => void } | undefined
>(undefined);

function Select({
  value,
  onValueChange,
  children,
}: {
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <SelectContext.Provider value={{ value, onValueChange }}>
      {children}
    </SelectContext.Provider>
  );
}

function SelectTrigger({
  className,
  children,
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children?: React.ReactNode;
}) {
  const context = React.useContext(SelectContext);
  return (
    <button
      type="button"
      className={cn(
        "flex h-11 w-full items-center justify-between rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400",
        className,
      )}
    >
      <span>{children ?? context?.value ?? "Select"}</span>
      <ChevronDown className="h-4 w-4 text-slate-400" />
    </button>
  );
}

function SelectContent({
  className,
  children,
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "mt-2 rounded-2xl border border-white/10 bg-slate-900 p-2 shadow-2xl",
        className,
      )}
    >
      {children}
    </div>
  );
}

function SelectItem({
  value,
  children,
}: {
  value: string;
  children: React.ReactNode;
}) {
  const context = React.useContext(SelectContext);
  const active = context?.value === value;

  return (
    <button
      type="button"
      onClick={() => context?.onValueChange?.(value)}
      className={cn(
        "flex w-full items-center rounded-xl px-3 py-2 text-left text-sm transition hover:bg-white/5",
        active ? "bg-cyan-500/10 text-cyan-300" : "text-slate-300",
      )}
    >
      {children}
    </button>
  );
}

export { Select, SelectTrigger, SelectContent, SelectItem };
