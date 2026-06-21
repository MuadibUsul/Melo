"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface PresetChipProps {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

export function PresetChip({ label, selected, onClick, disabled }: PresetChipProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-sm transition-colors",
        "border-panel-border bg-black/20 text-muted-foreground hover:border-studio-gold/45 hover:text-foreground",
        selected && "border-studio-gold/70 bg-studio-gold/15 text-foreground",
        disabled && "cursor-not-allowed opacity-45",
      )}
    >
      {selected ? <Check className="size-3.5 text-studio-gold" /> : null}
      {label}
    </button>
  );
}
