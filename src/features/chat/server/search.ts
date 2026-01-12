import type { ToolSet } from "ai";

// @ts-expect-error - patching @parallel-web/ai-sdk-tools
import { createParallelClient, extractTool, searchTool } from "@parallel-web/ai-sdk-tools";

/**
 * Creates search and extract tools for the AI model.
 *
 * @param parallelApiKey The Parallel Web API key for web search functionality.
 * @returns ToolSet with search and extract tools, or undefined if no key provided.
 */
export function createSearchTools(parallelApiKey?: string): ToolSet | undefined {
  if (!parallelApiKey) {
    return undefined;
  }

  const parallelClient = createParallelClient(parallelApiKey);

  return {
    search: {
      ...searchTool,
      execute: async (args, context) => {
        try {
          const result = await parallelClient.beta.search(
            args,
            {
              signal: context.abortSignal,
              headers: { "parallel-beta": "search-extract-2025-10-10" },
            },
          );
          return result;
        }
        catch (error) {
          console.error("[websearch] search tool error:", error);
          throw error;
        }
      },
    },
    extract: {
      ...extractTool,
      execute: async (args, context) => {
        try {
          const result = await parallelClient.beta.extract(
            args,
            {
              signal: context.abortSignal,
              headers: { "parallel-beta": "search-extract-2025-10-10" },
            },
          );
          return result;
        }
        catch (error) {
          console.error("[websearch] extract tool error:", error);
          throw error;
        }
      },
    },
  };
}
