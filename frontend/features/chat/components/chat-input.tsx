"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { Loader2, Paperclip, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const ACCEPTED_FILES = ".pdf,.docx";

interface ChatInputProps {
  employeeName?: string;
  disabled: boolean;
  isSending: boolean;
  /** Shows the attach button; only an EVE's owner can teach it files. */
  canAttach: boolean;
  /** Resolves false when sending failed; the text and file are then put back for a retry. */
  onSend: (text: string, file: File | null) => Promise<boolean>;
}

export function ChatInput({ employeeName, disabled, isSending, canAttach, onSend }: ChatInputProps) {
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canSend = !disabled && !isSending && (!!text.trim() || !!file);

  const submit = async () => {
    if (!canSend) return;
    const [sentText, sentFile] = [text, file];
    setText("");
    setFile(null);
    if (!(await onSend(sentText, sentFile))) {
      setText(sentText);
      setFile(sentFile);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="bg-white/5 p-4 border-t border-white/10">
      <div className="flex items-center gap-2 max-w-3xl mx-auto">
        <Input
          placeholder={employeeName ? `Message ${employeeName}...` : "Select employee..."}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled || isSending}
          className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/50"
        />
        {canAttach && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_FILES}
              hidden
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null);
                e.target.value = "";
              }}
            />
            <Button
              variant="ghost"
              className="text-white hover:bg-white/10"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || isSending}
              aria-label="Attach a PDF or Word file"
            >
              <Paperclip />
            </Button>
          </>
        )}
        <Button onClick={submit} disabled={!canSend} className="bg-indigo-600 hover:bg-indigo-700 text-white" aria-label="Send">
          {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send />}
        </Button>
      </div>
      {file && (
        <div className="text-xs text-white mt-2 flex items-center justify-between bg-white/10 p-2 rounded max-w-3xl mx-auto">
          <span className="truncate">{file.name}</span>
          <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-600" onClick={() => setFile(null)}>
            Remove
          </Button>
        </div>
      )}
    </div>
  );
}
