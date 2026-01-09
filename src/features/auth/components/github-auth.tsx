import { GithubIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import { authClient } from "~/features/auth/lib/auth-client";

async function handleGitHubSignIn() {
  try {
    await authClient.signIn.social({
      provider: "github",
      callbackURL: "/",
    });
  }
  catch (err) {
    toast.error(err instanceof Error ? err.message : "GitHub sign-in failed");
  }
}

export function GitHubAuth() {
  return (
    <Button
      variant="outline"
      className="w-full"
      onClick={handleGitHubSignIn}
    >
      <GithubIcon className="size-4" />
      Continue with GitHub
    </Button>
  );
}
