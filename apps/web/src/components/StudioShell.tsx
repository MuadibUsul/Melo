import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { SiteFooter } from "./SiteFooter";

interface StudioShellProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function StudioShell({
  eyebrow,
  title,
  description,
  actions,
  children,
  className,
}: StudioShellProps) {
  return (
    <main className={cn("studio-backdrop flex min-h-screen flex-col bg-background text-foreground", className)}>
      <div className="relative z-10 mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            {eyebrow ? (
              <div className="mb-3 inline-flex rounded-lg border border-panel-border bg-black/20 px-3 py-1 text-xs uppercase text-studio-gold">
                {eyebrow}
              </div>
            ) : null}
            <h1 className="text-3xl font-semibold">{title}</h1>
            {description ? (
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
          {actions}
        </div>
        {children}
      </div>
      <SiteFooter />
    </main>
  );
}
