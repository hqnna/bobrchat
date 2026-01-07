"use client";

import { PlusIcon } from "lucide-react";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarTrigger,
} from "~/components/ui/sidebar";
import { useSession } from "~/lib/auth-client";
import { useThreads } from "~/lib/queries/use-threads";
import { useUserSettings } from "~/lib/queries/use-user-settings";

import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import { ThreadList } from "./thread-list";
import { UserProfileCard } from "./user-profile-card";

function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return mounted;
}

function ThreadListSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map(i => (
        <Skeleton key={i} className="h-8 w-full" />
      ))}
    </div>
  );
}

function ThreadListContent() {
  const mounted = useMounted();
  const { data: session } = useSession();
  const { data: groupedThreads, isLoading: threadsLoading } = useThreads({
    enabled: mounted && !!session,
  });

  if (!mounted) {
    return <ThreadListSkeleton />;
  }

  if (!session) {
    return null;
  }

  if (threadsLoading) {
    return <ThreadListSkeleton />;
  }

  if (groupedThreads) {
    return <ThreadList groupedThreads={groupedThreads} />;
  }

  return null;
}

function UserProfileSkeleton() {
  return (
    <div className="space-y-3 p-4">
      <div className="flex items-center gap-3">
        <Skeleton className="size-9 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1">
          <Skeleton className="mb-2 h-4 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
    </div>
  );
}

function UserProfileContent() {
  const mounted = useMounted();
  const { data: session, isPending: sessionLoading } = useSession();
  const { data: settings } = useUserSettings({
    enabled: mounted && !!session,
  });

  const hasApiKey = settings?.apiKeyStorage?.openrouter !== undefined;

  if (!mounted) {
    return <UserProfileSkeleton />;
  }

  if (sessionLoading) {
    return <UserProfileSkeleton />;
  }

  if (session) {
    return <UserProfileCard session={session} hasApiKey={hasApiKey} />;
  }

  return null;
}

export function ChatSidebar() {
  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader className="p-0">
        <div className="flex h-14 items-center justify-between px-3">
          <div className="flex items-center gap-2">
            <div className="flex flex-col">
              <span className="text-base font-semibold tracking-tight">
                BobrChat
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              className="size-7"
              title="New chat"
              asChild
            >
              <Link href="/">
                <PlusIcon className="size-4" />
              </Link>
            </Button>
            <SidebarTrigger />
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <Suspense fallback={<ThreadListSkeleton />}>
            <ThreadListContent />
          </Suspense>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-0">
        <Suspense fallback={<UserProfileSkeleton />}>
          <UserProfileContent />
        </Suspense>
      </SidebarFooter>
    </Sidebar>
  );
}
