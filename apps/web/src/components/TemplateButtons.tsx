"use client";

import { Music2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { STUDIO_TEMPLATES, type StudioPreset } from "@/lib/presets";

interface TemplateButtonsProps {
  onSelect: (preset: StudioPreset) => void;
}

export function TemplateButtons({ onSelect }: TemplateButtonsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {STUDIO_TEMPLATES.map((template) => (
        <Button
          key={template.name}
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onSelect(template.preset)}
          className="h-8 rounded-md border-panel-border bg-black/20 px-2.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <Music2 className="size-3.5 text-studio-gold" />
          {template.name}
        </Button>
      ))}
    </div>
  );
}
