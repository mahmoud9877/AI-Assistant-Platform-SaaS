import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface FormFieldProps {
  /** Id of the control inside, so the label is linked to it. */
  id: string;
  label: string;
  error?: string;
  className?: string;
  labelClassName?: string;
  errorClassName?: string;
  children: ReactNode;
}

/** A label, its control, and an optional validation message. */
export function FormField({ id, label, error, className, labelClassName, errorClassName, children }: FormFieldProps) {
  return (
    <div className={cn("space-y-1", className)}>
      <Label htmlFor={id} className={labelClassName}>
        {label}
      </Label>
      {children}
      {error && (
        <p id={`${id}-error`} className={cn("text-sm text-red-400", errorClassName)}>
          {error}
        </p>
      )}
    </div>
  );
}
