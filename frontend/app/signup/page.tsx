"use client";

import { Suspense } from "react";
import { GuestOnly, SignupScreen } from "@/features/auth";
import { PageLoader } from "@/components/layout/page-loader";

// useSearchParams needs a Suspense boundary for static rendering.
export default function Page() {
  return (
    <Suspense fallback={<PageLoader />}>
      <GuestOnly>
        <SignupScreen />
      </GuestOnly>
    </Suspense>
  );
}
