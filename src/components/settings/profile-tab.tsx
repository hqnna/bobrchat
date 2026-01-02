"use client";

import { SaveIcon } from "lucide-react";
import { useCallback, useState } from "react";

import { useSession } from "~/lib/auth-client";
import { cn } from "~/lib/utils";

import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Skeleton } from "../ui/skeleton";

export function ProfileTab() {
  const { data: session, isPending } = useSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Initialize form with session data
  if (session?.user && !initialized) {
    setName(session.user.name || "");
    setEmail(session.user.email || "");
    setInitialized(true);
  }

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      // TODO: Implement profile update via better-auth
      // For now, just simulate a save
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    finally {
      setIsSaving(false);
    }
  }, []);

  const hasChanges = session?.user
    && (name !== session.user.name || email !== session.user.email);

  if (isPending) {
    return <ProfileTabSkeleton />;
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-6">
        <h3 className="text-lg font-semibold">Profile</h3>
        <p className="text-muted-foreground text-sm">
          Manage your account details and personal information.
        </p>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-md space-y-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-4">
            <Avatar className="size-20">
              <AvatarImage
                src={session?.user?.image || undefined}
                alt={session?.user?.name || "User"}
              />
              <AvatarFallback
                className={cn(`
                  from-primary/20 to-primary/5 ring-primary/20 bg-linear-to-br
                  text-lg ring-2
                `)}
              >
                {session?.user?.name?.slice(0, 2).toUpperCase() || "??"}
              </AvatarFallback>
            </Avatar>
            <p className="text-muted-foreground text-xs">
              Avatar is synced from your OAuth provider
            </p>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Display Name</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your display name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                disabled
              />
              <p className="text-muted-foreground text-xs">
                Email cannot be changed here. Use your OAuth provider to update it.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t p-4">
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
          >
            <SaveIcon className="size-4" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function ProfileTabSkeleton() {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-6">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-md space-y-6">
          <div className="flex flex-col items-center gap-4">
            <Skeleton className="size-20 rounded-full" />
            <Skeleton className="h-3 w-48" />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-9 w-full" />
            </div>

            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-3 w-72" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
