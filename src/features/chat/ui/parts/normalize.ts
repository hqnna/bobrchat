import type { ReasoningUIPart, SearchToolUIPart, TextUIPart } from "~/features/chat/types";

import {
  isSearchToolPart,
  isTextPart,
  isToolComplete,
  isToolError,
} from "~/features/chat/types";

export type NormalizedSource = {
  id: string;
  sourceType: string;
  url: string;
  title: string;
};

export type NormalizedSearchResult = {
  sources: NormalizedSource[];
  error?: string;
  complete: boolean;
};

/**
 * Normalizes reasoning text by stripping [REDACTED] markers and cleaning up newlines.
 * Returns null if the cleaned text is empty.
 */
export function normalizeReasoningText(text: string | undefined): string | null {
  if (!text)
    return null;

  const cleaned = text
    .replace(/\n\s*\[REDACTED\]/g, "") // Remove newlines before [REDACTED]
    .replace(/\[REDACTED\]/g, "") // Remove any remaining [REDACTED]
    .replace(/\\n/g, "\n") // Unescape literal \n to actual newlines
    .replace(/\n\s*\n/g, "\n") // Collapse multiple newlines to single
    .trim();

  return cleaned || null;
}

/**
 * Normalizes a search tool part, extracting sources and errors with stable IDs.
 * Uses URL as the stable key instead of Math.random().
 */
export function normalizeSearchToolPart(part: SearchToolUIPart): NormalizedSearchResult {
  const complete = isToolComplete(part.state);
  let sources: NormalizedSource[] = [];
  let error: string | undefined;

  // Handle error state
  if (isToolError(part.state)) {
    error = part.errorText || "Search failed";
  }
  // Handle output error in result
  else if (part.output?.error) {
    error = part.output.message || "Search failed";
  }
  // Handle successful results
  else if (part.output?.results && Array.isArray(part.output.results)) {
    sources = part.output.results.map(r => ({
      id: r.url || `search-result-${r.title}`,
      sourceType: "url",
      url: r.url,
      title: r.title,
    }));
  }

  return { sources, error, complete };
}

/**
 * Extracts text content from message parts.
 */
export function extractMessageText(parts: Array<{ type: string } & Record<string, unknown>>): string {
  return parts
    .filter(part => isTextPart(part))
    .map(part => (part as TextUIPart).text)
    .join("");
}

/**
 * Type guard for checking if a part has reasoning content.
 */
export function hasReasoningContent(part: ReasoningUIPart): boolean {
  return normalizeReasoningText(part.text) !== null;
}

/**
 * Type guard for checking if a search part has displayable content.
 */
export function hasSearchContent(part: { type: string }): boolean {
  if (!isSearchToolPart(part))
    return false;
  const result = normalizeSearchToolPart(part as SearchToolUIPart);
  return result.sources.length > 0 || !!result.error;
}
