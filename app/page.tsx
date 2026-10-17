"use client";

import { Suspense } from "react";
import { GuestOnly, LoginScreen } from "@/features/auth";
import { PageLoader } from "@/components/layout/page-loader";

// Logged-in users are sent on to `?next=` or the home page.
export default function LoginPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <GuestOnly>
        <LoginScreen />
      </GuestOnly>
    </Suspense>
  );
}
