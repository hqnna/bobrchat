"use client";

import { MessageCircle } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import type { GroupedThreads } from "~/lib/utils/thread-grouper";

import { cn } from "~/lib/utils";

type ThreadListProps = {
  groupedThreads: GroupedThreads;
};

export function ThreadList({ groupedThreads }: ThreadListProps) {
  const pathname = usePathname();
  const currentChatId = pathname.startsWith("/chat/")
    ? pathname.split("/chat/")[1]
    : null;

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
            <Link
              key={thread.id}
              href={`/chat/${thread.id}`}
              className={cn(
                `
                  group relative flex items-center gap-2 rounded-md px-2 py-1.5
                  text-sm transition-colors
                `,
                "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                currentChatId === thread.id
                  ? "bg-sidebar-accent"
                  : "text-sidebar-foreground",
              )}
            >
              <MessageCircle
                className="size-4"
                fill={currentChatId === thread.id ? "currentColor" : "none"}
              />
              <span className="flex-1 truncate">{thread.title}</span>
            </Link>
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
    </div>
  );
}
