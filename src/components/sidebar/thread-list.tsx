"use client";

import { useCallback, useState } from "react";
import { usePathname } from "next/navigation";

import type { GroupedThreads } from "~/lib/utils/thread-grouper";

import { DeleteThreadDialog } from "./delete-thread-dialog";
import { ThreadItem } from "./thread-item";

type ThreadListProps = {
  groupedThreads: GroupedThreads;
};

export function ThreadList({ groupedThreads }: ThreadListProps) {
  const pathname = usePathname();
  const currentChatId = pathname.startsWith("/chat/")
    ? pathname.split("/chat/")[1]
    : null;

  const [threadToDelete, setThreadToDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const handleDeleteClick = useCallback((threadId: string, threadTitle: string) => {
    setThreadToDelete({ id: threadId, title: threadTitle });
  }, []);

  const renderGroup = (
    title: string,
    threads: Array<{ id: string; title: string }>,
  ) => {
    if (threads.length === 0)
      return null;

    return (
      <div key={title} className="space-y-1">
        <h3 className={`
          text-sidebar-primary px-1 text-xs font-semibold tracking-wider
          uppercase
        `}
        >
          {title}
        </h3>
        <div className="space-y-0.5">
          {threads.map(thread => (
            <ThreadItem
              key={thread.id}
              id={thread.id}
              title={thread.title}
              isActive={currentChatId === thread.id}
              onDeleteClick={handleDeleteClick}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 py-2">
      {renderGroup("Today", groupedThreads.today)}
      {renderGroup("Last 7 Days", groupedThreads.last7Days)}
      {renderGroup("Last 30 Days", groupedThreads.last30Days)}
      {renderGroup("Older", groupedThreads.older)}
      {threadToDelete && (
        <DeleteThreadDialog
          open={!!threadToDelete}
          threadId={threadToDelete.id}
          threadTitle={threadToDelete.title}
          onOpenChange={(open) => {
            if (!open)
              setThreadToDelete(null);
          }}
        />
      )}
    </div>
  );
}
