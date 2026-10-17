"use client";

import { useState, type KeyboardEvent } from "react";
import { formatDistanceToNow } from "date-fns";
import { Check, Loader2, MessageSquarePlus, Pencil, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useConversationActions } from "../hooks";
import type { Conversation } from "../types";

interface ConversationListProps {
  conversations: Conversation[];
  isLoading: boolean;
  /** null while a new, not yet sent conversation is open. */
  activeId: number | null;
  onSelect: (id: number) => void;
  onNew: () => void;
  className?: string;
}

export function ConversationList({ conversations, isLoading, activeId, onSelect, onNew, className }: ConversationListProps) {
  return (
    <aside className={cn("flex-col w-full md:w-64 shrink-0 bg-eve md:bg-white/5 border-e border-white/10", className)}>
      <div className="p-3 border-b border-white/10">
        <Button onClick={onNew} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
          <MessageSquarePlus className="h-4 w-4 me-2" />
          New chat
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <nav aria-label="Conversations" className="p-2 space-y-1">
          {isLoading && <Loader2 className="h-5 w-5 animate-spin mx-auto my-6 text-indigo-200" />}
          {!isLoading && conversations.length === 0 && (
            <p className="text-sm text-indigo-200 text-center my-6 px-2">No conversations yet.</p>
          )}
          {conversations.map((conversation) => (
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
              isActive={conversation.id === activeId}
              onSelect={() => onSelect(conversation.id)}
            />
          ))}
        </nav>
      </ScrollArea>
    </aside>
  );
}

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onSelect: () => void;
}

function ConversationItem({ conversation, isActive, onSelect }: ConversationItemProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const { rename, remove: removeConversation } = useConversationActions();

  const saveTitle = async () => {
    const title = draft?.trim();
    setDraft(null);
    if (title && title !== conversation.title) rename(conversation, title);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter") saveTitle();
    if (e.key === "Escape") setDraft(null);
  };

  const remove = () => {
    if (window.confirm(`Delete "${conversation.title}"? This can't be undone.`)) removeConversation(conversation);
  };

  if (draft !== null) {
    return (
      <div className="flex items-center gap-1 p-1">
        <Input
          autoFocus
          value={draft}
          maxLength={120}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-label="Conversation title"
          className="h-8 bg-white/10 border-white/20 text-white text-sm"
        />
        <Button size="icon" variant="ghost" className="h-8 w-8 text-white hover:bg-white/10" onClick={saveTitle} aria-label="Save title">
          <Check className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" className="h-8 w-8 text-white hover:bg-white/10" onClick={() => setDraft(null)} aria-label="Cancel">
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group flex items-center gap-1 rounded-lg text-white transition-colors",
        isActive ? "bg-white/15" : "hover:bg-white/10"
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        aria-current={isActive ? "page" : undefined}
        className="flex-1 min-w-0 text-start px-3 py-2"
      >
        <span className="block text-sm truncate">{conversation.title}</span>
        <span className="block text-[11px] text-indigo-200">
          {formatDistanceToNow(new Date(conversation.updatedAt), { addSuffix: true })}
        </span>
      </button>
      {/* Always visible on touch screens, on hover or focus elsewhere. */}
      <div className="flex shrink-0 pe-1 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-indigo-200 hover:text-white hover:bg-white/10"
          onClick={() => setDraft(conversation.title)}
          aria-label={`Rename "${conversation.title}"`}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-red-300 hover:text-red-100 hover:bg-red-700/60"
          onClick={remove}
          aria-label={`Delete "${conversation.title}"`}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
