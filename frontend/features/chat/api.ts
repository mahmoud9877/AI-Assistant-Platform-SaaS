import { ApiError, apiRequest, apiStream } from "@/lib/api-client";
import type { ChatMessage, Conversation } from "./types";

export const chatApi = {
  /** The user's conversations with one employee, most recently active first. */
  list: async (employeeId: number) =>
    (await apiRequest<{ conversations: Conversation[] }>(`/conversations?employeeId=${employeeId}`)).conversations,

  create: async (employeeId: number) =>
    (await apiRequest<{ conversation: Conversation }>("/conversations", { method: "POST", body: { employeeId } }))
      .conversation,

  get: (id: number) => apiRequest<{ conversation: Conversation; messages: ChatMessage[] }>(`/conversations/${id}`),

  rename: async (id: number, title: string) =>
    (await apiRequest<{ conversation: Conversation }>(`/conversations/${id}`, { method: "PATCH", body: { title } }))
      .conversation,

  remove: (id: number) => apiRequest<void>(`/conversations/${id}`, { method: "DELETE" }),

  /**
   * Like send, but EVE's reply arrives piece by piece: `onText` gets each piece as it is
   * written. Resolves with the saved messages once the reply is complete.
   */
  sendStream: async (id: number, message: string, file: File | null, onText: (text: string) => void) => {
    const form = new FormData();
    form.append("message", message);
    if (file) form.append("file", file);

    let result: { conversation: Conversation; messages: ChatMessage[] } | undefined;
    let failure: string | undefined;
    await apiStream(`/conversations/${id}/messages/stream`, { method: "POST", body: form }, (event, data) => {
      if (event === "delta") onText((data as { text: string }).text);
      else if (event === "done") result = data as typeof result;
      else if (event === "error") failure = (data as { message: string }).message;
    });
    if (!result) throw new ApiError(failure ?? "The reply was cut off. Please try again.", 502);
    return result;
  },

  /** Sends a message (and optionally a PDF/DOCX for the EVE to learn from); returns it with the reply. */
  send: (id: number, message: string, file?: File | null) => {
    const form = new FormData();
    form.append("message", message);
    if (file) form.append("file", file);
    return apiRequest<{ conversation: Conversation; messages: ChatMessage[] }>(`/conversations/${id}/messages`, {
      method: "POST",
      body: form,
    });
  },
};
