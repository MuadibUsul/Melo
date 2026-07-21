"use client";

import { useEffect, useState } from "react";
import { Coins } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/auth-context";

const LOCAL_USER_KEY = "melo.demo.user";

function readLocalCredits() {
  try {
    const raw = window.localStorage.getItem(LOCAL_USER_KEY);
    if (!raw) return null;
    const user = JSON.parse(raw) as { credits?: number };
    return typeof user.credits === "number" ? user.credits : null;
  } catch {
    return null;
  }
}

export function CreditBadge() {
  const { user } = useAuth();
  const [credits, setCredits] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;

    async function loadCredits() {
      try {
        const result = await api.get<{ balance: number }>("/entitlement/balance");
        setCredits(result.balance);
      } catch {
        setCredits(readLocalCredits());
      }
    }

    const timer = window.setTimeout(loadCredits, 0);
    const listener = () => loadCredits();
    window.addEventListener("credits-updated", listener);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("credits-updated", listener);
    };
  }, [user]);

  if (!user || credits === null) return null;

  return (
    <Badge
      variant="secondary"
      className="hidden gap-1.5 border border-studio-gold/30 bg-studio-gold/10 text-studio-gold md:inline-flex"
    >
      <Coins className="size-3.5" />
      {credits} {"\u989d\u5ea6"}
    </Badge>
  );
}
