import type { ReactNode } from "react";
import { assetUrl } from "@/lib/api-client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { BackLink } from "@/components/shared/back-link";
import type { EmployeeCard } from "@/features/employees";

interface ChatHeaderProps {
  employee: EmployeeCard | null;
  backHref: string;
  /** Extra controls on the right, e.g. an employee picker. */
  action?: ReactNode;
}

export function ChatHeader({ employee, backHref, action }: ChatHeaderProps) {
  return (
    <div className="bg-white/5 p-4 border-b border-white/10 flex items-center justify-between gap-4">
      <BackLink href={backHref} />

      <div className="flex items-center gap-3 min-w-0">
        <Avatar>
          <AvatarImage src={assetUrl(employee?.photoUrl)} alt="" />
          <AvatarFallback className="bg-blue-500 text-white">{employee?.name?.[0] ?? "E"}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <h2 className="font-semibold truncate">{employee?.name ?? "EVE"}</h2>
          <p className="text-sm text-indigo-200 truncate">{employee?.department ?? "AI Assistant"}</p>
        </div>
        {employee?.status && (
          <Badge variant="outline" className="text-xs border-indigo-400 text-white whitespace-nowrap">
            {employee.status}
          </Badge>
        )}
      </div>

      <div className="min-w-10 flex justify-end">{action}</div>
    </div>
  );
}
