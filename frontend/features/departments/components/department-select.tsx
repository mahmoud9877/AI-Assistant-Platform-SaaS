"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDepartments } from "../hooks";

export const ALL_DEPARTMENTS = "all";

interface DepartmentSelectProps {
  /** A department id as a string, `ALL_DEPARTMENTS`, or "" for none. */
  value: string | undefined;
  onChange: (value: string) => void;
  id?: string;
  placeholder?: string;
  className?: string;
  /** Adds an "all departments" option with value `ALL_DEPARTMENTS`, labelled `allLabel`. */
  allLabel?: string;
}

/** Picks a department from the list admins manage; values are department ids. */
export function DepartmentSelect({ value, onChange, id, placeholder, className, allLabel }: DepartmentSelectProps) {
  const { data: departments = [], isPending } = useDepartments();

  return (
    // Radix shows the placeholder for "", so an empty value means "none chosen".
    <Select value={value || undefined} onValueChange={onChange} disabled={isPending}>
      <SelectTrigger id={id} className={className} aria-label={id ? undefined : "Department"}>
        <SelectValue placeholder={isPending ? "…" : placeholder} />
      </SelectTrigger>
      <SelectContent>
        {allLabel && <SelectItem value={ALL_DEPARTMENTS}>{allLabel}</SelectItem>}
        {departments.map((department) => (
          <SelectItem key={department.id} value={String(department.id)}>
            {department.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
