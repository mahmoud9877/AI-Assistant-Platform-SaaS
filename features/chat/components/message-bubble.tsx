import { format } from "date-fns";
import { FileText, Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";
import { isStreaming } from "../hooks";
import type { ChatMessage } from "../types";

export function MessageBubble({ message }: { message: ChatMessage }) {
  const fromUser = message.role === "user";
  const streaming = isStreaming(message);
  // The user's message not yet confirmed by the server has a temporary string id.
  const isPending = typeof message.id === "string" && !streaming;

  return (
    <div className={cn("flex flex-col", fromUser ? "items-end" : "items-start")}>
      <div
        className={cn(
          "max-w-[70%] px-4 py-2 rounded-2xl shadow-md text-white",
          isPending && "opacity-70",
          fromUser ? "bg-gradient-to-r from-indigo-600 to-purple-600" : "bg-white/10 border border-white/10"
        )}
      >
        {message.fileName && (
          <p className="text-xs opacity-80 flex items-center gap-1 mb-1">
            <Paperclip className="h-3 w-3" />
            {message.fileName}
          </p>
        )}
        <p className="text-sm whitespace-pre-wrap break-words">
          {message.content}
          {streaming && <span className="inline-block w-1.5 h-4 ms-0.5 align-text-bottom bg-white/70 animate-pulse" aria-hidden />}
        </p>
        {!!message.sources?.length && (
          <div className="mt-2 pt-2 border-t border-white/10 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-indigo-200">Sources:</span>
            {message.sources.map((source) => (
              <span
                key={source.documentId}
                className="inline-flex items-center gap-1 max-w-full rounded-full bg-white/10 px-2 py-0.5 text-[11px]"
                title={source.fileName}
              >
                <FileText className="h-3 w-3 shrink-0" />
                <span className="truncate">{source.fileName}</span>
              </span>
            ))}
          </div>
        )}
      </div>
      <span className="text-[10px] opacity-60 mt-1">{format(new Date(message.createdAt), "HH:mm")}</span>
    </div>
  );
}
