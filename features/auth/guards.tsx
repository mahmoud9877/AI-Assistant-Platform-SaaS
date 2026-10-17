"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PageLoader } from "@/components/layout/page-loader";
import { useAuth } from "./store";
import { LOGIN_PATH, loginUrlFor, safeNextPath } from "./redirect";

/** Shows `children` only to logged-in users; others go to the login page and come back afterwards. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, signOutReason } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading || isAuthenticated) return;
    // After a deliberate sign-out, don't send the next person back to this page.
    router.replace(
      signOutReason === "signed-out" ? LOGIN_PATH : loginUrlFor(`${pathname}${window.location.search}`)
    );
  }, [isLoading, isAuthenticated, signOutReason, pathname, router]);

  return isAuthenticated ? <>{children}</> : <PageLoader />;
}

/** Shows `children` only to logged-out users; logged-in users go to `?next=` or the home page. */
export function GuestOnly({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const next = safeNextPath(useSearchParams().get("next"));

  useEffect(() => {
    if (isAuthenticated) router.replace(next);
  }, [isAuthenticated, next, router]);

  return isLoading || isAuthenticated ? <PageLoader /> : <>{children}</>;
}
