"use client";

import { Suspense } from "react";
import { KnowledgePage } from "@/features/knowledge";
import { PageLoader } from "@/components/layout/page-loader";

// useSearchParams needs a Suspense boundary for static rendering.
export default function Page() {
  return (
    <Suspense fallback={<PageLoader />}>
      <KnowledgePage />
    </Suspense>
  );
}
