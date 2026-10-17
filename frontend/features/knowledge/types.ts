/** A file an EVE employee was taught. */
export interface KnowledgeDocument {
  id: number;
  employeeId: number;
  fileName: string;
  /** Length of the file's text; counts toward the EVE's knowledge limit. */
  characters: number;
  chunkCount: number;
  createdAt: string;
}

/** Mirrors the backend's per-EVE knowledge limit. */
export const MAX_KNOWLEDGE_CHARACTERS = 1_000_000;
