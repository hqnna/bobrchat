"use client";

import type { InfiniteData } from "@tanstack/react-query";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";

import type { GroupedThreads } from "~/features/chat/utils/thread-grouper";

import { createNewThread, deleteThread, fetchThreadStats, regenerateThreadName, renameThread } from "~/features/chat/actions";
import { groupThreadsByDate } from "~/features/chat/utils/thread-grouper";
import { THREADS_KEY } from "~/lib/queries/query-keys";

export { THREADS_KEY };

type ThreadFromApi = {
  id: string;
  title: string;
  lastMessageAt: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
  isShared: boolean;
};

type ThreadsResponse = {
  threads: ThreadFromApi[];
  nextCursor: string | null;
};

type CreateThreadInput = {
  threadId: string;
  title?: string;
};

async function fetchThreads({ pageParam }: { pageParam: string | undefined }): Promise<ThreadsResponse> {
  const params = new URLSearchParams({ limit: "50" });
  if (pageParam) {
    params.set("cursor", pageParam);
  }
  const response = await fetch(`/api/threads?${params.toString()}`);
  if (!response.ok)
    throw new Error("Failed to fetch threads");
  return response.json();
}

export function useThreads(options: { enabled?: boolean } = {}) {
  const query = useInfiniteQuery({
    queryKey: THREADS_KEY,
    queryFn: fetchThreads,
    initialPageParam: undefined as string | undefined,
    getNextPageParam: lastPage => lastPage.nextCursor ?? undefined,
    staleTime: 30 * 1000,
    enabled: options.enabled,
  });

  const groupedThreads: GroupedThreads | undefined = useMemo(() => {
    if (!query.data)
      return undefined;

    const allThreads = query.data.pages.flatMap(page =>
      page.threads.map(t => ({
        ...t,
        lastMessageAt: t.lastMessageAt ? new Date(t.lastMessageAt) : null,
      })),
    );
    return groupThreadsByDate(allThreads);
  }, [query.data]);

  return {
    ...query,
    data: groupedThreads,
  };
}

export function useCreateThread() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateThreadInput) =>
      createNewThread({ threadId: input.threadId, title: input.title }),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: THREADS_KEY });

      const previous = queryClient.getQueryData<InfiniteData<ThreadsResponse>>(THREADS_KEY);

      const now = new Date().toISOString();
      const optimisticThread: ThreadFromApi = {
        id: input.threadId,
        title: input.title || "New Chat",
        lastMessageAt: now,
        userId: "",
        createdAt: now,
        updatedAt: now,
        isShared: false,
      };

      queryClient.setQueryData<InfiniteData<ThreadsResponse>>(THREADS_KEY, (old) => {
        if (!old) {
          return {
            pages: [{ threads: [optimisticThread], nextCursor: null }],
            pageParams: [undefined],
          };
        }

        const [first, ...rest] = old.pages;
        const withoutDup = first.threads.filter(t => t.id !== input.threadId);

        return {
          ...old,
          pages: [{ ...first, threads: [optimisticThread, ...withoutDup] }, ...rest],
        };
      });

      return { previous };
    },
    onError: (_err, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(THREADS_KEY, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: THREADS_KEY });
    },
  });
}

export function useDeleteThread() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (threadId: string) => deleteThread(threadId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: THREADS_KEY });
    },
  });
}

export function useRenameThread() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ threadId, newTitle }: { threadId: string; newTitle: string }) =>
      renameThread(threadId, newTitle),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: THREADS_KEY });
    },
  });
}

export function useRegenerateThreadName() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ threadId, clientKey }: { threadId: string; clientKey?: string }) =>
      regenerateThreadName(threadId, clientKey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: THREADS_KEY });
    },
  });
}

export type ThreadStats = {
  messageCount: number;
  attachmentCount: number;
  attachmentSize: number;
};

export function useThreadStats(threadId: string | null) {
  return useQuery({
    queryKey: ["thread-stats", threadId] as const,
    queryFn: () => fetchThreadStats(threadId!),
    enabled: !!threadId,
    staleTime: 60 * 1000,
  });
}
