"use client";

import { useSession } from "~/lib/auth-client";

const DEFAULT_PROMPTS = [
  "Could I beat a bear in a fight?",
  "What came first? Wi or Fi?",
  "Why is the default MacOS terminal so bad?",
  "What the hell is a token and why are they expensive?",
];

export function SuggestionsContent({
  onSuggestionClick,
}: {
  onSuggestionClick?: (suggestion: string) => void;
}) {
  const { data: session } = useSession();
  const firstName = session?.user?.name?.split(" ")[0];
  const isMounted = typeof window !== "undefined";

  // Don't render until user name is loaded
  if (!firstName) {
    return null;
  }

  return (
    <div className={`
      space-y-6 transition-all duration-300
      ${isMounted
      ? `opacity-100`
      : `opacity-0`}
    `}
    >
      <div>
        <h2 className="text-2xl font-semibold">
          Hi
          {" "}
          {firstName}
          , what's on your mind?
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {DEFAULT_PROMPTS.map(prompt => (
          <button
            key={prompt}
            onClick={() => onSuggestionClick?.(prompt)}
            className={`
              hover:bg-card
              focus-visible:ring-primary focus-visible:ring-2
              focus-visible:outline-none
              rounded-lg p-2 text-left transition-colors
            `}
            title={prompt}
          >
            <p className="line-clamp-2 text-sm">{prompt}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
