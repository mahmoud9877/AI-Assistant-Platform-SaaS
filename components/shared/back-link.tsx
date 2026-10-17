import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** A ghost button with a left arrow; shows `label` next to the arrow when given. */
export function BackLink({ href, label, className }: { href: string; label?: string; className?: string }) {
  return (
    <Button asChild variant="ghost" className={cn("text-white hover:bg-white/10", className)}>
      <Link href={href} aria-label={label ? undefined : "Back"}>
        <ArrowLeft className={cn("h-5 w-5 rtl:rotate-180", label && "me-2 h-4 w-4")} />
        {label}
      </Link>
    </Button>
  );
}
