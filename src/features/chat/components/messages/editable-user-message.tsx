"use client";

import { useMemo } from "react";

import type { ChatUIMessage } from "~/app/api/chat/route";

import { cn } from "~/lib/utils";

import type { EditedMessagePayload, ExistingAttachment } from "./inline-message-editor";

import { UserMessageMetrics } from "../ui/user-message-metrics";
import { InlineMessageEditor } from "./inline-message-editor";
import { UserMessage } from "./user-message";

type EditableUserMessageProps = {
  message: ChatUIMessage;
  previousModelId: string | null;
  isEditing: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSubmitEdit: (payload: EditedMessagePayload) => Promise<void>;
  canEdit?: boolean;
  isSubmitting?: boolean;
};

type FilePart = {
  type: "file";
  id?: string;
  url: string;
  filename?: string;
  mediaType?: string;
  storagePath?: string;
};

function extractTextAndAttachments(message: ChatUIMessage): {
  textContent: string;
  attachments: ExistingAttachment[];
} {
  const textParts = message.parts
    .filter(part => part.type === "text")
    .map(part => part.text);

  const fileParts = message.parts
    .filter(part => part.type === "file")
    .reduce<ExistingAttachment[]>((attachments, part) => {
      const filePart = part as FilePart;

      if (!filePart.id) {
        return attachments;
      }

      attachments.push({
        id: filePart.id,
        url: filePart.url,
        filename: filePart.filename,
        mediaType: filePart.mediaType,
        storagePath: filePart.storagePath,
      });

      return attachments;
    }, []);
  return {
    textContent: textParts.join(""),
    attachments: fileParts,
  };
}

export function EditableUserMessage({
  message,
  previousModelId,
  isEditing,
  onStartEdit,
  onCancelEdit,
  onSubmitEdit,
  canEdit = true,
  isSubmitting = false,
}: EditableUserMessageProps) {
  const { textContent, attachments } = useMemo(
    () => extractTextAndAttachments(message),
    [message],
  );

  return (
    <div className="group flex w-full flex-col items-end gap-2">
      <div className={cn(`
        relative w-full max-w-[80%]
        md:max-w-[70%]
      `, isEditing
        ? `
          max-w-[90%]
          md:max-w-[80%]
        `
        : "")}
      >
        <div
          className={cn(
            "transition-all duration-200 ease-out",
            isEditing
              ? "pointer-events-none absolute inset-0 scale-95 opacity-0"
              : "static scale-100 opacity-100",
          )}
        >
          <div className="flex flex-col items-end">
            <UserMessage
              content={textContent}
              attachments={attachments.length > 0 ? attachments : undefined}
            />
          </div>
        </div>

        <div
          className={cn(
            "transition-all duration-200 ease-out",
            isEditing
              ? "static scale-100 opacity-100"
              : "pointer-events-none absolute inset-0 scale-95 opacity-0",
          )}
        >
          {isEditing && (
            <InlineMessageEditor
              initialContent={textContent}
              initialAttachments={attachments}
              initialSearchEnabled={message.searchEnabled ?? false}
              initialReasoningLevel={message.reasoningLevel ?? "none"}
              initialModelId={previousModelId}
              onCancel={onCancelEdit}
              onSubmit={onSubmitEdit}
              isSubmitting={isSubmitting}
            />
          )}
        </div>
      </div>

      {!isEditing && (
        <UserMessageMetrics
          content={textContent}
          onEdit={canEdit ? onStartEdit : undefined}
        />
      )}
    </div>
  );
}
