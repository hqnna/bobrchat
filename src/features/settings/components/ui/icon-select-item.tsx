"use client";

import {
  Book,
  Code,
  FileText,
  Heart,
  Lightbulb,
  MessageCircle,
  MessageSquare,
  Sparkles,
  Star,
  Zap,
} from "lucide-react";

import type { ThreadIcon } from "~/lib/db/schema/chat";

import { Label } from "~/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { THREAD_ICONS } from "~/lib/db/schema/chat";
import { cn } from "~/lib/utils";

const ICON_COMPONENTS: Record<ThreadIcon, React.ComponentType<{ className?: string }>> = {
  "message-circle": MessageCircle,
  "message-square": MessageSquare,
  "sparkles": Sparkles,
  "lightbulb": Lightbulb,
  "code": Code,
  "book": Book,
  "file-text": FileText,
  "star": Star,
  "heart": Heart,
  "zap": Zap,
};

const ICON_LABELS: Record<ThreadIcon, string> = {
  "message-circle": "Chat",
  "message-square": "Message",
  "sparkles": "Sparkles",
  "lightbulb": "Ideas",
  "code": "Code",
  "book": "Notes",
  "file-text": "Document",
  "star": "Starred",
  "heart": "Favorite",
  "zap": "Quick",
};

type IconSelectItemProps = {
  label: string;
  description?: string;
  value: ThreadIcon;
  onChange: (value: ThreadIcon) => void;
};

export function IconSelectItem({
  label,
  description,
  value,
  onChange,
}: IconSelectItemProps) {
  const SelectedIcon = ICON_COMPONENTS[value];

  return (
    <div className="flex items-center justify-between space-x-2">
      <div className="flex flex-col space-y-1">
        <Label>{label}</Label>
        {description && (
          <span className="text-muted-foreground text-xs">{description}</span>
        )}
      </div>
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "border-input hover:bg-muted flex size-9 items-center justify-center rounded-md border transition-colors",
            )}
          >
            <SelectedIcon className="size-4" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" align="end">
          <div className="grid grid-cols-5 gap-1">
            {THREAD_ICONS.map((iconName) => {
              const Icon = ICON_COMPONENTS[iconName];
              const isSelected = value === iconName;

              return (
                <button
                  key={iconName}
                  type="button"
                  onClick={() => onChange(iconName)}
                  title={ICON_LABELS[iconName]}
                  className={cn(
                    "hover:bg-accent flex size-8 items-center justify-center rounded-md transition-colors",
                    isSelected && "bg-accent",
                  )}
                >
                  <Icon className="size-4" />
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
