import { QueryCache, QueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api-client";
import { notifyError } from "@/lib/notify";

declare module "@tanstack/react-query" {
  interface Register {
    queryMeta: {
      /** Toast title shown when this query fails. */
      errorMessage?: string;
    };
  }
}

/** Server data (employees, conversations, knowledge) is cached here; client state lives in Zustand stores. */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (err, query) => {
        if (query.meta?.errorMessage) notifyError(query.meta.errorMessage, err);
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        // A 4xx won't change on retry (401s are already refreshed by the API client).
        retry: (failureCount, err) => !(err instanceof ApiError && err.status < 500) && failureCount < 2,
      },
    },
  });
}
