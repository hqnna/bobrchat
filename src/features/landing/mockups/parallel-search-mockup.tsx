"use client";

import { ChevronDown, ExternalLink, FileText, Globe } from "lucide-react";

export function ParallelSearchMockup() {
  return (
    <div className="flex w-full max-w-md flex-col gap-4 text-sm">
      {/* User message */}
      <div className={`
        bg-primary text-background ml-auto max-w-[85%] rounded-2xl rounded-br-sm
        px-4 py-2.5
      `}
      >
        read up on how AI works for me
      </div>

      {/* Sources used - collapsed style */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs">
          <Globe className="h-4 w-4" />
          <span className="font-medium">Sources used</span>
          <ChevronDown className="h-3 w-3" />
        </div>
        <div className="flex flex-col gap-1 pl-6 text-xs">
          <span
            className="text-primary flex items-center gap-2"
          >
            <ExternalLink className="h-3 w-3" />
            <span className="truncate">Explained: Neural networks | MIT News</span>
          </span>
          <span
            className="text-primary flex items-center gap-2"
          >
            <ExternalLink className="h-3 w-3" />
            <span className="truncate">What Is a Neural Network? | IBM</span>
          </span>
        </div>
      </div>

      {/* Extracted pages - collapsed style */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs">
          <FileText className="h-4 w-4" />
          <span className="font-medium">Extracted pages</span>
          <ChevronDown className="h-3 w-3" />
        </div>
        <div className="flex flex-col gap-1 pl-6 text-xs">
          <span
            className="text-primary flex items-center gap-2"
          >
            <ExternalLink className="h-3 w-3" />
            <span className="truncate">Explained: Neural networks | MIT News</span>
          </span>
        </div>
      </div>

      {/* Model response */}
      <div className="text-foreground/90 text-sm leading-relaxed">
        This article from MIT News explains that...
      </div>
    </div>
  );
}
