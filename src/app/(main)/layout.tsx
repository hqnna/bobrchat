import { HydrationBoundary } from "@tanstack/react-query";
import { headers } from "next/headers";
import { Suspense } from "react";

import { ChatSidebar } from "~/components/sidebar/chat-sidebar";
import { FloatingSidebarToggle } from "~/components/sidebar/floating-sidebar-toggle";
import { SidebarProvider } from "~/components/ui/sidebar";
import { GlobalDropZoneProvider } from "~/features/attachments/components/global-drop-zone";
import { auth } from "~/features/auth/lib/auth";
import { SettingsModalProvider } from "~/features/settings/components/settings-modal-provider";
import { prefetchThreads } from "~/lib/queries/prefetch-threads";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const dehydratedState = session?.user
    ? await prefetchThreads(session.user.id)
    : undefined;

  return (
    <HydrationBoundary state={dehydratedState}>
      <GlobalDropZoneProvider>
        <SidebarProvider>
          {session && <ChatSidebar session={session} />}
          {session && <FloatingSidebarToggle />}
          <main className="w-full">
            {children}
          </main>
          <Suspense fallback={null}>
            <SettingsModalProvider />
          </Suspense>
        </SidebarProvider>
      </GlobalDropZoneProvider>
    </HydrationBoundary>
  );
}
