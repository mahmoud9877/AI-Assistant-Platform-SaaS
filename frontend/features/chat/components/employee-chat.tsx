"use client";

import Link from "next/link";
import { useEmployee, useMyEmployees } from "@/features/employees";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/layout/page-loader";
import { ChatWindow } from "./chat-window";

/** Chat with any EVE employee in the office, by id. */
export default function EmployeeChat({ employeeId }: { employeeId: number }) {
  const { data: employee, error, isLoading } = useEmployee(employeeId);
  const { data: mine = [] } = useMyEmployees();

  if (isLoading) return <PageLoader />;

  if (error || !employee) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-eve text-white">
        <p className="text-lg">Could not load this employee.</p>
        <Button asChild variant="outline" className="bg-transparent text-white border-white/30 hover:bg-white/10">
          <Link href="/virtual-office">Back to the office</Link>
        </Button>
      </div>
    );
  }

  return (
    <ChatWindow employee={employee} backHref="/virtual-office" canTeach={mine.some((own) => own.id === employee.id)} />
  );
}
