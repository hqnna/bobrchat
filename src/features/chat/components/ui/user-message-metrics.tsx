"use client";

import { CheckIcon, CopyIcon, EditIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

type UserMessageMetricsProps = {
  content: string;
  onEdit?: () => void;
};

export function UserMessageMetrics({ content, onEdit }: UserMessageMetricsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
    catch (error) {
      console.error("Failed to copy:", error);
      toast.error("Failed to copy message content");
    }
  };

  return (
    <div
      className={cn(
        `
          text-muted-foreground mt-1 flex items-center justify-end gap-3 text-xs
          transition-opacity duration-200
        `,
        `
          opacity-0
          group-hover:opacity-100
        `,
      )}
    >
      {/* Edit Button */}
      <Button
        variant="ghost"
        size="sm"
        disabled={!onEdit}
        onClick={onEdit}
        title="Edit message"
        className="h-6 w-6 p-0"
      >
        <EditIcon className="h-3.5 w-3.5" />
      </Button>

      {/* Copy Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopy}
        title="Copy message content"
        className="h-6 w-6 p-0"
      >
        {copied
          ? <CheckIcon className="h-3.5 w-3.5" />
          : <CopyIcon className="h-3.5 w-3.5" />}
      </Button>
    </div>
  );
}
