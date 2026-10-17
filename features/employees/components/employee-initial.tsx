import { cn } from "@/lib/utils";

/** A square or round badge with the first letter of a name. */
export function EmployeeInitial({ name, className }: { name: string | null | undefined; className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-900 font-semibold text-white",
        className
      )}
      title={name ?? undefined}
    >
      {name?.charAt(0).toUpperCase() ?? "E"}
    </div>
  );
}
