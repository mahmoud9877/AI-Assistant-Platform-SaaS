import { apiRequest } from "@/lib/api-client";
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
