"use client";

import type { DehydratedState } from "@tanstack/react-query";

import { HydrationBoundary, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { useChatUIStore } from "~/features/chat/store";

export function QueryProvider({
  children,
  dehydratedState,
}: {
  children: React.ReactNode;
  dehydratedState?: DehydratedState;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: true,
          },
        },
      }),
  );

  const loadApiKeysFromStorage = useChatUIStore(s => s.loadApiKeysFromStorage);

  useEffect(() => {
    loadApiKeysFromStorage();
  }, [loadApiKeysFromStorage]);

  return (
    <QueryClientProvider client={queryClient}>
      <HydrationBoundary state={dehydratedState}>
        {children}
      </HydrationBoundary>
    </QueryClientProvider>
  );
}
