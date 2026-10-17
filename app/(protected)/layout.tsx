"use client";

import type { ReactNode } from "react";
import { RequireAuth } from "@/features/auth";

// Every page in this route group requires a logged-in user.
export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return <RequireAuth>{children}</RequireAuth>;
}
