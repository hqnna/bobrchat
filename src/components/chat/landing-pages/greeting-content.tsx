"use client";

import { useSession } from "~/lib/auth-client";

export function GreetingContent() {
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
    </div>
  );
}
