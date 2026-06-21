"use client";

import { Textarea } from "@/components/ui/textarea";

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function PromptInput({ value, onChange, placeholder }: PromptInputProps) {
  return (
    <Textarea
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="min-h-36 resize-none border-panel-border bg-black/25 text-base leading-7"
    />
  );
}
