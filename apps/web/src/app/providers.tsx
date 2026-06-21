"use client";

import type { ReactNode } from "react";
import { ApiProviders } from "@/lib/api/providers";
import { AuthProvider } from "@/lib/auth/auth-context";
import { Toaster } from "@/components/ui/toast";
import { GlobalPlayer } from "@/components/GlobalPlayer";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ApiProviders>
      <AuthProvider>
        {children}
        <GlobalPlayer />
        <Toaster />
      </AuthProvider>
    </ApiProviders>
  );
}
