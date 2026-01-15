export function parseAIError(error: unknown): string {
  if (!(error instanceof Error)) {
    return "An unexpected error occurred";
  }

  return error.message || "Failed to send message";
}
