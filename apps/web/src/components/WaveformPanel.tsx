import { AudioLines } from "lucide-react";
import { cn } from "@/lib/utils";

interface WaveformPanelProps {
  active?: boolean;
  compact?: boolean;
  label?: string;
  className?: string;
}

export function WaveformPanel({
  active = false,
  compact = false,
  label = "\u97f3\u9891\u6ce2\u5f62",
  className,
}: WaveformPanelProps) {
  const count = compact ? 36 : 72;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border border-panel-border bg-black/30",
        compact ? "h-20" : "h-32",
        className,
      )}
      aria-label={label}
    >
      <div className="absolute inset-x-4 top-1/2 h-px bg-foreground/10" />
      <div className="absolute inset-3 flex items-center gap-1">
        {Array.from({ length: count }).map((_, index) => {
          const height = 18 + ((index * 23) % 74);

          return (
            <span
              key={index}
              className={cn(
                "w-full rounded-full bg-foreground/45",
                index % 11 === 0 && "bg-studio-gold/80",
                index % 17 === 0 && "bg-meter-green/80",
                active && "animate-[meter-rise_1.35s_ease-in-out_infinite]",
              )}
              style={{
                height: `${height}%`,
                animationDelay: `${index * 35}ms`,
              }}
            />
          );
        })}
      </div>
      <div className="absolute bottom-3 left-3 flex items-center gap-2 text-xs text-muted-foreground">
        <AudioLines className="size-3.5" />
        <span>{"\u5de5\u4f5c\u53f0\u6ce2\u5f62"}</span>
      </div>
    </div>
  );
}
