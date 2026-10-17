/** One chat thread between the user and an EVE employee. */
export interface Conversation {
  id: number;
  employeeId: number;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  /** A string id marks a message still on its way to the server. */
  id: number | string;
  role: "user" | "assistant";
  content: string;
  fileName: string | null;
  /** The knowledge files an EVE reply is based on. */
  sources?: { documentId: number; fileName: string }[] | null;
  createdAt: string;
}
