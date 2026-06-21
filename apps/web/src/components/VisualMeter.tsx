import { cn } from "@/lib/utils";

interface VisualMeterProps {
  bars?: number;
  active?: boolean;
  compact?: boolean;
  className?: string;
}

export function VisualMeter({
  bars = 18,
  active = false,
  compact = false,
  className,
}: VisualMeterProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "flex items-end gap-1 overflow-hidden rounded-lg border border-panel-border bg-black/25 p-2",
        compact ? "h-12" : "h-24",
        className,
      )}
    >
      {Array.from({ length: bars }).map((_, index) => {
        const height = 22 + ((index * 31) % 68);

        return (
          <span
            key={index}
            className={cn(
              "w-full origin-bottom rounded-t-[2px]",
              index % 5 === 0
                ? "bg-studio-gold"
                : index % 3 === 0
                  ? "bg-meter-green"
                  : "bg-foreground/58",
              active && "animate-[meter-rise_1.15s_ease-in-out_infinite]",
            )}
            style={{
              height: `${height}%`,
              animationDelay: `${index * 58}ms`,
            }}
          />
        );
      })}
    </div>
  );
}
