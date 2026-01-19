import type { TextStreamPart, ToolSet } from "ai";

import type { SearchToolResult, ToolResultStreamPart } from "~/features/chat/types";

import { isToolResultPart } from "~/features/chat/types";

type Source = { id: string; sourceType: string; url?: string; title?: string };

type StreamChunkHandler = {
  onFirstToken: () => void;
  onSource: (source: Source) => void;
};

/**
 * Creates handlers for processing stream chunks.
 *
 * @param onFirstTokenCallback Called when the first token is received
 * @param onSourceCallback Called when a source is found
 * @returns An object with chunk handlers
 */
export function createStreamHandlers(
  onFirstTokenCallback: () => void,
  onSourceCallback: (source: Source) => void,
): StreamChunkHandler {
  return {
    onFirstToken: onFirstTokenCallback,
    onSource: onSourceCallback,
  };
}

/**
 * Extracts sources from a Parallel search tool result.
 */
function extractSourcesFromToolResult(result: unknown): Source[] {
  if (!result)
    return [];

  try {
    const data = typeof result === "string" ? JSON.parse(result) : result;
    const searchResult = data as SearchToolResult;
    const items = searchResult.results ?? [];

    return items
      .filter(item => item?.url)
      .map(item => ({
        id: item.url,
        sourceType: "url" as const,
        url: item.url,
        title: item.title,
      }));
  }
  catch {
    return [];
  }
}

/**
 * Processes stream chunks and triggers appropriate handlers.
 *
 * @param part The stream chunk to process
 * @param handlers The chunk handlers
 */
export function processStreamChunk(part: TextStreamPart<ToolSet>, handlers: StreamChunkHandler) {
  if (part.type === "text-start") {
    handlers.onFirstToken();
  }
  else if (part.type === "source") {
    handlers.onSource({
      id: part.id,
      sourceType: part.sourceType,
      ...(part.sourceType === "url" && {
        url: part.url,
        title: part.title,
      }),
    });
  }
  else if (isToolResultPart(part)) {
    const toolPart = part as ToolResultStreamPart;
    if (toolPart.toolName === "search") {
      const sources = extractSourcesFromToolResult(toolPart.output);
      sources.forEach(handlers.onSource);
    }
  }
}
