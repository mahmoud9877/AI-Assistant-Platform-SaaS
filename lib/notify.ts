import { toast } from "@/hooks/use-toast";

/** A readable message for anything thrown. */
export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

export function notifySuccess(title: string, description?: string): void {
  toast({ title, description });
}

/** Shows a red toast; `cause` can be an error (its message is shown) or text. */
export function notifyError(title: string, cause?: unknown): void {
  toast({ title, description: cause === undefined ? undefined : errorMessage(cause), variant: "destructive" });
}
