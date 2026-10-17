"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { BookOpen, History, Loader2, Settings2 } from "lucide-react";
import { isStreaming, useConversations, useMessages, useSendMessage } from "../hooks";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { EmployeeCard } from "@/features/employees";
import { ChatHeader } from "./chat-header";
import { ChatInput } from "./chat-input";
import { ConversationList } from "./conversation-list";
import { MessageBubble } from "./message-bubble";

interface ChatWindowProps {
  employee: EmployeeCard | null;
  backHref: string;
  /** Whether the user may attach files for this EVE to learn from (only its owner can). */
  canTeach: boolean;
  /** Extra header controls, e.g. an employee picker. */
  headerAction?: ReactNode;
  emptyHint?: string;
}

export function ChatWindow({ employee, backHref, canTeach, headerAction, emptyHint }: ChatWindowProps) {
  const [showHistory, setShowHistory] = useState(false);

  return (
    <div className="flex flex-col h-screen bg-eve text-white">
      <ChatHeader
        employee={employee}
        backHref={backHref}
        action={
          <div className="flex items-center gap-2">
            {headerAction}
            {employee && canTeach && (
              <Button
                asChild
                variant="outline"
                size="sm"
                className="border-white/20 bg-transparent text-white hover:bg-white/10"
              >
                <Link href={`/knowledge?employeeId=${employee.id}`} aria-label="Files this EVE knows" title="Files this EVE knows">
                  <BookOpen />
                </Link>
              </Button>
            )}
            {employee && canTeach && (
              <Button
                asChild
                variant="outline"
                size="sm"
                className="border-white/20 bg-transparent text-white hover:bg-white/10"
              >
                <Link href={`/manage-eve?employeeId=${employee.id}`} aria-label="EVE settings" title="EVE settings">
                  <Settings2 />
                </Link>
              </Button>
            )}
            {employee && (
              <Button
                variant="outline"
                size="sm"
                className="md:hidden border-white/20 bg-transparent text-white hover:bg-white/10"
                onClick={() => setShowHistory((open) => !open)}
                aria-label="Conversations"
                aria-expanded={showHistory}
              >
                <History />
              </Button>
            )}
          </div>
        }
      />

      {employee ? (
        // Keyed so switching employees starts from that employee's latest conversation.
        <EmployeeConversations
          key={employee.id}
          employee={employee}
          canTeach={canTeach}
          showHistory={showHistory}
          onHistoryDone={() => setShowHistory(false)}
        />
      ) : (
        <>
          <p className="flex-1 text-center text-indigo-200 mt-10">{emptyHint}</p>
          <ChatInput disabled isSending={false} canAttach={false} onSend={async () => false} />
        </>
      )}
    </div>
  );
}

interface EmployeeConversationsProps {
  employee: EmployeeCard;
  canTeach: boolean;
  /** Small screens show the list instead of the messages while this is on. */
  showHistory: boolean;
  onHistoryDone: () => void;
}

function EmployeeConversations({ employee, canTeach, showHistory, onHistoryDone }: EmployeeConversationsProps) {
  const { conversations, isLoading: listLoading } = useConversations(employee.id);
  // undefined: nothing picked yet (open the latest); "new": an empty, unsaved conversation.
  const [picked, setPicked] = useState<number | "new">();
  const pickedExists = typeof picked === "number" && conversations.some((c) => c.id === picked);
  const activeId = picked === "new" ? null : pickedExists ? (picked as number) : (conversations[0]?.id ?? null);

  const { messages, isLoading, isSending } = useMessages(activeId);
  // "Typing…" only until the first words of the reply arrive.
  const isWaiting = isSending && !messages.some(isStreaming);
  const sendMessage = useSendMessage(employee.id);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  const select = (id: number | "new") => {
    setPicked(id);
    onHistoryDone();
  };

  const send = (text: string, file: File | null) =>
    sendMessage(activeId, text.trim(), file, (id) => setPicked(id));

  return (
    <div className="relative flex flex-1 min-h-0">
      <ConversationList
        conversations={conversations}
        isLoading={listLoading}
        activeId={activeId}
        onSelect={select}
        onNew={() => select("new")}
        className={showHistory ? "flex absolute inset-0 z-10 md:static" : "hidden md:flex"}
      />

      <div className="flex flex-col flex-1 min-w-0">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4 max-w-3xl mx-auto">
            {isLoading && <Loader2 className="h-6 w-6 animate-spin mx-auto mt-10 text-indigo-200" />}

            {!isLoading && !listLoading && messages.length === 0 && (
              <p className="text-center text-indigo-200 mt-10">Say hello to {employee.name ?? "EVE"}.</p>
            )}

            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}

            {isWaiting && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                <div className="px-4 py-2 bg-white/10 border border-white/10 rounded-2xl text-sm text-gray-200 italic">
                  {employee.name ?? "EVE"} is typing...
                </div>
              </motion.div>
            )}

            <div ref={endRef} />
          </div>
        </ScrollArea>

        {/* Not keyed by conversation: a failed first send must put the text back after the new id arrives. */}
        <ChatInput
          employeeName={employee.name ?? undefined}
          disabled={listLoading}
          isSending={isSending}
          canAttach={canTeach}
          onSend={send}
        />
      </div>
    </div>
  );
}
