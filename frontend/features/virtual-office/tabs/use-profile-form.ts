"use client";

import { useState, type FormEvent } from "react";
import { useUpdateEmployee } from "@/features/employees";
import { notifyError, notifySuccess } from "@/lib/notify";
import type { EmployeeCard, EmployeeStatus } from "@/features/employees";

export interface ProfileValues {
  id: number;
  name: string;
  /** Department id as a string, "" for none. */
  departmentId: string;
  role: string;
  status: EmployeeStatus;
}

/** Editing state for one of the user's employees; saving refreshes every employee list. */
export function useProfileForm() {
  const [values, setValues] = useState<ProfileValues | null>(null);
  const update = useUpdateEmployee();

  const edit = (employee: EmployeeCard) => {
    setValues({
      id: employee.id,
      name: employee.name,
      departmentId: employee.departmentId ? String(employee.departmentId) : "",
      role: employee.role,
      status: employee.status,
    });
    notifySuccess(`Now editing ${employee.name}'s profile`);
  };

  const change = (changes: Partial<ProfileValues>) =>
    setValues((prev) => (prev ? { ...prev, ...changes } : prev));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!values) return;

    try {
      await update.mutateAsync({
        id: values.id,
        changes: {
          name: values.name.trim(),
          departmentId: values.departmentId ? Number(values.departmentId) : null,
          role: values.role.trim(),
          status: values.status,
        },
      });
      notifySuccess("Profile Updated", "Your virtual office profile has been updated successfully.");
    } catch (err) {
      notifyError("Error", err);
    }
  };

  return { values, isSaving: update.isPending, edit, change, submit };
}
