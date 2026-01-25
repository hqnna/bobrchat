import type { InferUITools } from "ai";

import { tool } from "ai";

import { parallelExtract, parallelSearch } from "./client";
import {
  extractInputSchema,
  searchInputSchema,
} from "./types";

const SEARCH_DESCRIPTION = `Search the web for information. Use this tool to find current information, facts, or research on any topic.

Guidelines:
- Keep the objective concise but descriptive (what you want to learn)
- Use search_queries for specific keyword searches (1-6 words each)
- Use "agentic" mode for conversational follow-ups, "one-shot" for comprehensive single queries
- Use include_domains to restrict to trusted sources (e.g., official docs, Wikipedia)
- Use exclude_domains to filter out unreliable or irrelevant sites`;

const EXTRACT_DESCRIPTION = `Extract content from specific web URLs. Use this after search to get detailed content from promising results, or when you have specific URLs to analyze.

Guidelines:
- Provide a clear objective describing what information you need
- Pass URLs from search results or user-provided links
- Use search_queries to focus extraction on relevant sections`;

/**
 * Creates search tools with the given API key.
 * Returns a strongly-typed tool set that can be used with InferUITools.
 */
export function createSearchTools(apiKey: string) {
  return {
    search: tool({
      description: SEARCH_DESCRIPTION,
      inputSchema: searchInputSchema,
      execute: async (input, { abortSignal }) => {
        return parallelSearch(apiKey, input, abortSignal);
      },
    }),
    extract: tool({
      description: EXTRACT_DESCRIPTION,
      inputSchema: extractInputSchema,
      execute: async (input, { abortSignal }) => {
        return parallelExtract(apiKey, input, abortSignal);
      },
    }),
  } as const;
}

/**
 * Type representing the search tools for UI type inference.
 * Use with InferUITools to get typed tool parts in the UI.
 */
export type SearchTools = ReturnType<typeof createSearchTools>;

/**
 * Inferred UI tool types for type-safe message part rendering.
 * This gives you typed `input` and `output` on tool parts.
 */
export type SearchUITools = InferUITools<SearchTools>;
