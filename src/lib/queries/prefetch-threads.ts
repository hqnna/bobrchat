import { dehydrate, QueryClient } from "@tanstack/react-query";

import { getThreadsByUserId } from "~/features/chat/queries";
import { fetchOpenRouterModels } from "~/features/models/actions";
import { MODELS_KEY, THREADS_KEY } from "~/lib/queries/query-keys";

export async function prefetchThreads(userId: string) {
  const queryClient = new QueryClient();

  await Promise.all([
    queryClient.prefetchInfiniteQuery({
      queryKey: THREADS_KEY,
      queryFn: async ({ pageParam }) => {
        const result = await getThreadsByUserId(userId, {
          limit: 50,
          cursor: pageParam,
        });
        return result;
      },
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (lastPage: { nextCursor: string | null }) =>
        lastPage.nextCursor ?? undefined,
      pages: 1,
    }),
    queryClient.prefetchQuery({
      queryKey: MODELS_KEY,
      queryFn: () => fetchOpenRouterModels(),
      staleTime: 24 * 60 * 60 * 1000,
    }).catch(() => {
      // If prefetch fails (no API key, etc.), that's fine - client will fetch
    }),
  ]);

  return dehydrate(queryClient);
}
