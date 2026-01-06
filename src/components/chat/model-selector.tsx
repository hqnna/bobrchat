"use client";

import type { Model } from "@openrouter/sdk/models";

import {
  BrainIcon,
  ChevronDownIcon,
  FileIcon,
  ImageIcon,
} from "lucide-react";
import * as React from "react";

import { cn } from "~/lib/utils";

import { Button } from "../ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover";

type ModelSelectorProps = {
  models: Model[];
  selectedModelId?: string;
  onSelectModel: (modelId: string) => void;
  className?: string;
};

export function ModelSelector({
  models,
  selectedModelId,
  onSelectModel,
  className,
}: ModelSelectorProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  if (!models || models.length === 0) {
    return null;
  }

  const selectedModel = models.find(m => m.id === selectedModelId);
  const displayName = selectedModel?.name || "Select Model";

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(`
            hover:text-foreground
            gap-2 transition-colors
          `, `text-muted-foreground`, className)}
          title="Select model"
        >
          <div className="text-sm font-medium">
            {displayName}
          </div>
          <ChevronDownIcon size={14}
            className={`${isOpen ? "rotate-180" : ""} transition-transform`}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
            alignOffset={-9}
            sideOffset={61}
        className="w-3xl p-2 rounded-none shadow-none"
      >
        <div className="space-y-1">
          {models.map(model => (
            <Button
              key={model.id}
              variant="ghost"
              onClick={() => {
                onSelectModel(model.id);
                setIsOpen(false);
              }}
              className={cn(`
                justify-between
                w-full rounded px-2 py-2 h-12 text-left transition-colors
              `, selectedModelId === model.id
                ? "bg-primary/10 text-primary"
                : `
                  hover:bg-muted hover:text-foreground
                  text-muted-foreground
                `)}
            >
              <div className="flex-1">
                <div className="text-sm font-medium">
                  {model.name}
                </div>
                <div className="text-xs opacity-75">
                  {model.id}
                </div>
              </div>
              <div className="flex gap-1">
                {model.architecture.inputModalities.includes("image") && (
                  <ImageIcon
                    size={14}
                    className="shrink-0"
                  />
                )}
                {model.supportedParameters.includes("reasoning") && (
                  <BrainIcon
                    size={14}
                    className="shrink-0"
                  />
                )}
                {model.architecture.inputModalities.includes("file") && (
                  <FileIcon
                    size={14}
                    className="shrink-0"
                  />
                )}
              </div>
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
