"use client";

import { useEffect, useState, type ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthSession, onSignOut } from "@/features/auth";
import { createQueryClient } from "@/lib/query-client";
import { restoreLanguage } from "@/lib/i18n";

export function Providers({ children }: { children: ReactNode }) {
  // One client per browser session (and per request during server rendering).
  const [queryClient] = useState(createQueryClient);

  useEffect(restoreLanguage, []);
  // Everything cached for the signed-in user goes when their session ends; conversations
  // can hold uploaded document text, so they must not outlive it.
  useEffect(() => onSignOut(() => queryClient.clear()), [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthSession />
      {children}
    </QueryClientProvider>
  );
}
