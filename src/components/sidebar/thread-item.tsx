"use client";

import { MessageCircle, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { deleteThread } from "~/server/actions/chat";

type ThreadItemProps = {
  id: string;
  title: string;
  isActive: boolean;
  onDeleteClick?: (threadId: string, threadTitle: string) => void;
};

export function ThreadItem({
  id,
  title,
  isActive,
  onDeleteClick,
}: ThreadItemProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const performDirectDelete = async () => {
    try {
      await deleteThread(id);
      router.push("/");
    }
    catch (error) {
      console.error("Failed to delete thread:", error);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Control+Click = direct delete without dialog
    if (e.ctrlKey || e.metaKey) {
      startTransition(performDirectDelete);
    }
    else {
      // Regular click = show dialog
      onDeleteClick?.(id, title);
    }
  };

  return (
    <div className="group/thread relative">
      <Link
        href={`/chat/${id}`}
        className={cn(
          `
            flex items-center gap-2 rounded-md px-2 py-1.5 text-sm
            transition-colors
          `,
          "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          isActive
            ? "bg-sidebar-accent"
            : "text-sidebar-foreground",
        )}
      >
        <MessageCircle
          className="size-4 shrink-0"
          fill={isActive ? "currentColor" : "none"}
        />
        <span className="flex-1 truncate">{title}</span>
      </Link>
      <Button
        variant="ghost"
        size="icon-sm"
        className={
          `
            absolute top-1 right-1 size-6 p-2 opacity-0 transition-opacity
            group-hover/thread:opacity-100
          `
        }

        onClick={handleDeleteClick}
        disabled={isPending}
        title="Delete thread (Ctrl+Click to delete immediately)"
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}
