"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { knowledgeApi } from "./api";

export const knowledgeKeys = {
  // Also invalidated by the chat when a file is sent there.
  all: ["knowledge"] as const,
  list: (employeeId: number) => [...knowledgeKeys.all, employeeId] as const,
};

/** The files one of the user's EVEs has been taught, newest first. */
export const useKnowledge = (employeeId: number) =>
  useQuery({
    queryKey: knowledgeKeys.list(employeeId),
    queryFn: () => knowledgeApi.list(employeeId),
    meta: { errorMessage: "Failed to load the files" },
  });

/** Uploading and deleting an EVE's files; the list refreshes after either. */
export function useKnowledgeActions(employeeId: number) {
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: knowledgeKeys.list(employeeId) });

  const upload = useMutation({ mutationFn: (file: File) => knowledgeApi.upload(employeeId, file), onSuccess: refresh });
  const remove = useMutation({ mutationFn: (documentId: number) => knowledgeApi.remove(documentId), onSuccess: refresh });

  return { upload, remove };
}
