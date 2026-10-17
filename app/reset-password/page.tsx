"use client";

import { Suspense } from "react";
import { ResetPasswordScreen } from "@/features/auth";
import { PageLoader } from "@/components/layout/page-loader";

// useSearchParams needs a Suspense boundary for static rendering.
export default function Page() {
  return (
    <Suspense fallback={<PageLoader />}>
      <ResetPasswordScreen />
    </Suspense>
  );
}
