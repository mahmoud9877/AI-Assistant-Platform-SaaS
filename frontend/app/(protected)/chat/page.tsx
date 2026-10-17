"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { EmployeeChat } from "@/features/chat";
import { PageLoader } from "@/components/layout/page-loader";

function ChatPage() {
  const employeeId = Number(useSearchParams().get("employeeId"));

  if (!Number.isInteger(employeeId) || employeeId <= 0) {
    return <PageLoader label="No employee selected." />;
  }
  return <EmployeeChat employeeId={employeeId} />;
}

// useSearchParams needs a Suspense boundary for static rendering.
export default function Page() {
  return (
    <Suspense fallback={<PageLoader />}>
      <ChatPage />
    </Suspense>
  );
}
