"use client";

import { useMutation, useMutationState, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { notifyError } from "@/lib/notify";
import { chatApi } from "./api";
import type { ChatMessage, Conversation } from "./types";

export const chatKeys = {
  all: ["chat"] as const,
  conversations: (employeeId: number) => [...chatKeys.all, "conversations", employeeId] as const,
  messages: (conversationId: number) => [...chatKeys.all, "messages", conversationId] as const,
  send: () => [...chatKeys.all, "send"] as const,
};

// Knowledge files the EVE learned through the chat show up on the Knowledge page.
const KNOWLEDGE_KEY = ["knowledge"] as const;

const NO_MESSAGES: ChatMessage[] = [];

// Chats used to be kept only in localStorage under these keys; they live on the server now.
if (typeof window !== "undefined") {
  try {
    Object.keys(localStorage)
      .filter((key) => key.startsWith("eve-chat:"))
      .forEach((key) => localStorage.removeItem(key));
  } catch {
    // Storage is blocked, so nothing was stored there either.
  }
}

/** The user's conversations with one employee, most recently active first. */
export function useConversations(employeeId: number) {
  const query = useQuery({
    queryKey: chatKeys.conversations(employeeId),
    queryFn: () => chatApi.list(employeeId),
    meta: { errorMessage: "Failed to load conversations" },
  });
  return { conversations: query.data ?? [], isLoading: query.isPending };
}

interface SendVariables {
  employeeId: number;
  conversationId: number;
  text: string;
  file: File | null;
}

/** One conversation's messages (none for a new, unsaved one) and whether a reply is pending. */
export function useMessages(conversationId: number | null) {
  const query = useQuery({
    queryKey: chatKeys.messages(conversationId ?? 0),
    queryFn: async () => (await chatApi.get(conversationId!)).messages,
    enabled: conversationId !== null,
    // Kept current by the send mutation; a refetch mid-send would drop the pending message.
    staleTime: Infinity,
    meta: { errorMessage: "Failed to load messages" },
  });
  const pending = useMutationState({
    filters: { mutationKey: chatKeys.send(), status: "pending" },
    select: (mutation) => (mutation.state.variables as SendVariables).conversationId,
  });

  return {
    messages: conversationId === null ? NO_MESSAGES : (query.data ?? NO_MESSAGES),
    isLoading: conversationId !== null && query.isPending,
    isSending: conversationId !== null && pending.includes(conversationId),
  };
}

/** Id of EVE's reply while it is still streaming in (one send per conversation at a time). */
export const streamingId = (conversationId: number) => `streaming-${conversationId}`;

/** True for a message still being written by EVE. */
export const isStreaming = (message: ChatMessage) => typeof message.id === "string" && message.id.startsWith("streaming-");

// Puts a changed conversation first, as the server orders by latest activity.
function moveToTop(queryClient: QueryClient, conversation: Conversation): void {
  queryClient.setQueryData<Conversation[]>(chatKeys.conversations(conversation.employeeId), (list = []) => [
    conversation,
    ...list.filter((c) => c.id !== conversation.id),
  ]);
}

/**
 * Sending, for a chat window. `send` posts to `conversationId`, or first starts a new
 * conversation when it is null (`onStarted` receives its id). Resolves false when nothing
 * was sent, so the input can give the text and file back for a retry. The reply lands in
 * the right conversation even if the user has switched to another one meanwhile.
 */
export function useSendMessage(employeeId: number) {
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: () => chatApi.create(employeeId),
    onSuccess: (conversation) => {
      queryClient.setQueryData<ChatMessage[]>(chatKeys.messages(conversation.id), []);
      moveToTop(queryClient, conversation);
    },
    onError: (err) => notifyError("Failed to start a conversation", err),
  });

  const sendMessage = useMutation({
    mutationKey: chatKeys.send(),
    // The reply streams into a temporary EVE message that grows with each piece.
    mutationFn: ({ conversationId, text, file }: SendVariables) =>
      chatApi.sendStream(conversationId, text, file, (piece) =>
        queryClient.setQueryData<ChatMessage[]>(chatKeys.messages(conversationId), (list = []) => {
          const last = list.at(-1);
          if (last?.id === streamingId(conversationId)) {
            return [...list.slice(0, -1), { ...last, content: last.content + piece }];
          }
          return [
            ...list,
            {
              id: streamingId(conversationId),
              role: "assistant",
              content: piece,
              fileName: null,
              createdAt: new Date().toISOString(),
            },
          ];
        })
      ),
    // Shown right away; replaced by the stored message once the reply arrives.
    onMutate: async ({ conversationId, text, file }) => {
      const key = chatKeys.messages(conversationId);
      await queryClient.cancelQueries({ queryKey: key });
      const pending: ChatMessage = {
        id: `pending-${Date.now()}`,
        role: "user",
        content: text || "Sent a file",
        fileName: file?.name ?? null,
        createdAt: new Date().toISOString(),
      };
      queryClient.setQueryData<ChatMessage[]>(key, (list = []) => [...list, pending]);
      return { pendingId: pending.id };
    },
    onSuccess: ({ conversation, messages }, { conversationId, file }, context) => {
      queryClient.setQueryData<ChatMessage[]>(chatKeys.messages(conversationId), (list = []) => [
        ...list.filter((m) => m.id !== context.pendingId && m.id !== streamingId(conversationId)),
        ...messages,
      ]);
      moveToTop(queryClient, conversation);
      if (file) queryClient.invalidateQueries({ queryKey: KNOWLEDGE_KEY });
    },
    onError: (err, { conversationId }, context) => {
      queryClient.setQueryData<ChatMessage[]>(chatKeys.messages(conversationId), (list = []) =>
        list.filter((m) => m.id !== context?.pendingId && m.id !== streamingId(conversationId))
      );
      notifyError("Failed to get response from EVE", err);
    },
  });

  return async (
    conversationId: number | null,
    text: string,
    file: File | null,
    onStarted: (conversationId: number) => void
  ): Promise<boolean> => {
    let id = conversationId;
    if (id === null) {
      try {
        id = (await create.mutateAsync()).id;
      } catch {
        return false;
      }
    }
    onStarted(id);
    try {
      await sendMessage.mutateAsync({ employeeId, conversationId: id, text, file });
      return true;
    } catch {
      return false;
    }
  };
}

/** Renaming and deleting conversations. */
export function useConversationActions() {
  const queryClient = useQueryClient();

  const rename = useMutation({
    mutationFn: ({ conversation, title }: { conversation: Conversation; title: string }) =>
      chatApi.rename(conversation.id, title),
    onSuccess: (renamed) =>
      queryClient.setQueryData<Conversation[]>(chatKeys.conversations(renamed.employeeId), (list = []) =>
        list.map((c) => (c.id === renamed.id ? renamed : c))
      ),
    onError: (err) => notifyError("Failed to rename the conversation", err),
  });

  const remove = useMutation({
    mutationFn: (conversation: Conversation) => chatApi.remove(conversation.id),
    // Its cached messages are left for garbage collection: removing them while the window
    // still shows the conversation would make React Query fetch the deleted one again.
    onSuccess: (_result, conversation) =>
      queryClient.setQueryData<Conversation[]>(chatKeys.conversations(conversation.employeeId), (list = []) =>
        list.filter((c) => c.id !== conversation.id)
      ),
    onError: (err) => notifyError("Failed to delete the conversation", err),
  });

  return {
    rename: (conversation: Conversation, title: string) => rename.mutate({ conversation, title }),
    remove: (conversation: Conversation) => remove.mutate(conversation),
  };
}
