import { apiRequest } from "@/lib/api-client";
import type { KnowledgeDocument } from "./types";

export const knowledgeApi = {
  list: async (employeeId: number) =>
    (await apiRequest<{ documents: KnowledgeDocument[] }>(`/knowledge?employeeId=${employeeId}`)).documents,

  /** Uploads a PDF or DOCX; the EVE can answer from it once this resolves. */
  upload: async (employeeId: number, file: File) => {
    const form = new FormData();
    form.append("employeeId", String(employeeId));
    form.append("file", file);
    return (await apiRequest<{ document: KnowledgeDocument }>("/knowledge", { method: "POST", body: form })).document;
  },

  remove: (id: number) => apiRequest<void>(`/knowledge/${id}`, { method: "DELETE" }),
};
