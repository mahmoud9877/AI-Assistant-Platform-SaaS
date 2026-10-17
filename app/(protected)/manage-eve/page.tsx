"use client";

import { Suspense } from "react";
import { ManageEvePage } from "@/features/manage-eve";
import { PageLoader } from "@/components/layout/page-loader";

// useSearchParams needs a Suspense boundary for static rendering.
export default function Page() {
  return (
    <Suspense fallback={<PageLoader />}>
      <ManageEvePage />
    </Suspense>
  );
}
