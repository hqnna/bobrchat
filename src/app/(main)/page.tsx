import { headers } from "next/headers";

import { auth } from "~/features/auth/lib/auth";
import { LandingPage } from "~/features/landing/landing-page";
import { getUserSettings } from "~/features/settings/queries";

import { AuthenticatedHome } from "./authenticated-home";

export default async function HomePage(): Promise<React.ReactNode> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return <LandingPage />;
  }

  const settings = await getUserSettings(session.user.id);

  return (
    <AuthenticatedHome
      defaultThreadName={settings.defaultThreadName}
      defaultThreadIcon={settings.defaultThreadIcon}
      landingPageContent={settings.landingPageContent}
    />
  );
}
