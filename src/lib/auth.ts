import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { createDefaultUserSettings } from "~/server/db/queries/settings";

import { db } from "./db";
import { serverEnv } from "./env";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    usePlural: true,
  }),
  secret: serverEnv.BETTER_AUTH_SECRET,
  baseURL: serverEnv.BETTER_AUTH_URL,
  baseAuthPath: "/api/auth",
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    github: {
      clientId: serverEnv.GITHUB_CLIENT_ID,
      clientSecret: serverEnv.GITHUB_CLIENT_SECRET,
    },
  },
  databaseHooks: {
    user: {
      create: {
        async after(user) {
          await createDefaultUserSettings(user.id);
        },
      },
    },
  },
  advanced: {
    database: {
      generateId: () => crypto.randomUUID(),
    },
  },
});

// i really hate that this is how the docs want me to do this
export type Session = typeof auth.$Infer.Session;
