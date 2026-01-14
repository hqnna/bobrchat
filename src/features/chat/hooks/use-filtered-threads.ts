"use client";

import Fuse from "fuse.js";
import { useDeferredValue, useMemo } from "react";

import type { GroupedThreads } from "~/features/chat/utils/thread-grouper";

type Thread = {
  id: string;
  title: string;
};

type UseFilteredThreadsResult = {
  groupedThreads: GroupedThreads | undefined;
  flatResults: Thread[] | undefined;
  isSearching: boolean;
};

export function useFilteredThreads(
  groupedThreads: GroupedThreads | undefined,
  searchQuery: string,
): UseFilteredThreadsResult {
  const deferredQuery = useDeferredValue(searchQuery.trim().toLowerCase());
  const isSearching = deferredQuery.length > 0;

  const flatThreads = useMemo(() => {
    if (!groupedThreads)
      return [];
    return [
      ...groupedThreads.today,
      ...groupedThreads.last7Days,
      ...groupedThreads.last30Days,
      ...groupedThreads.older,
    ];
  }, [groupedThreads]);

  const fuse = useMemo(() => {
    if (!flatThreads.length)
      return null;

    return new Fuse(flatThreads, {
      keys: ["title"],
      threshold: 0.4,
      minMatchCharLength: 2,
      ignoreLocation: true,
    });
  }, [flatThreads]);

  const flatResults = useMemo(() => {
    if (!isSearching || !fuse)
      return undefined;
    return fuse.search(deferredQuery).map(result => result.item);
  }, [isSearching, fuse, deferredQuery]);

  return {
    groupedThreads: isSearching ? undefined : groupedThreads,
    flatResults,
    isSearching,
  };
}
