"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useMyEmployees, EmployeePicker } from "@/features/employees";
import { Button } from "@/components/ui/button";
import { ChatWindow } from "./chat-window";

/** Chat with one of the user's own EVE employees, chosen from a picker. */
export default function MyEveChat() {
  const { data: employees = [], isLoading } = useMyEmployees();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  // Default to the first employee until the user picks one.
  const selected = employees.find((emp) => emp.id === selectedId) ?? employees[0] ?? null;

  return (
    <ChatWindow
      employee={selected}
      backHref="/home"
      canTeach
      emptyHint={isLoading ? "Loading..." : "You don't have an EVE employee yet."}
      headerAction={
        employees.length > 1 && (
          <EmployeePicker
            employees={employees}
            onSelect={(emp) => setSelectedId(emp.id)}
            title="Employees"
            trigger={
              <Button
                variant="outline"
                size="sm"
                className="border-white/20 bg-transparent text-white hover:bg-white/10"
                aria-label="Choose employee"
              >
                <ChevronDown />
              </Button>
            }
          />
        )
      }
    />
  );
}
