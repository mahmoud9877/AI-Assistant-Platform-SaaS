"use client";

import { useState, type ReactNode } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { EmployeeCard } from "../types";

interface EmployeePickerProps {
  employees: EmployeeCard[];
  onSelect: (employee: EmployeeCard) => void;
  /** The button that opens the list. */
  trigger: ReactNode;
  title: string;
  emptyText?: string;
}

/** A popover listing employees; picking one calls `onSelect` and closes it. */
export function EmployeePicker({ employees, onSelect, trigger, title, emptyText }: EmployeePickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="w-72 bg-white text-gray-900 shadow-xl border border-gray-300 rounded-xl">
        <h4 className="font-semibold mb-3 text-lg">{title}</h4>
        {employees.length === 0 ? (
          <p className="text-sm text-gray-500">{emptyText}</p>
        ) : (
          <ul className="space-y-2 max-h-60 overflow-y-auto pe-1">
            {employees.map((emp) => (
              <li key={emp.id}>
                <button
                  type="button"
                  className="w-full text-start hover:bg-gray-100 p-2 rounded-md border border-gray-200"
                  onClick={() => {
                    onSelect(emp);
                    setOpen(false);
                  }}
                >
                  <p className="font-medium text-gray-800">{emp.name}</p>
                  <p className="text-xs text-gray-500">{emp.department}</p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
