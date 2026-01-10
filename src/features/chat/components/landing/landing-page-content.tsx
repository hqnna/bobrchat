"use client";

import type { LandingPageContentType } from "~/features/settings/types";

import { GreetingContent } from "./greeting-content";
import { SuggestionsContent } from "./suggestions-content";

export function LandingPageContent({
  type,
  isVisible,
  onSuggestionClickAction,
}: {
  type: LandingPageContentType;
  isVisible: boolean;
  onSuggestionClickAction?: (suggestion: string) => void;
}) {
  if (type === "blank") {
    return null;
  }

  return (
    <div
      className="transition-all duration-300 ease-in-out"
      style={{
        opacity: isVisible ? 1 : 0,
        pointerEvents: isVisible ? "auto" : "none",
      }}
    >
      {type === "suggestions" && <SuggestionsContent onSuggestionClickAction={onSuggestionClickAction} />}
      {type === "greeting" && <GreetingContent />}
    </div>
  );
}
