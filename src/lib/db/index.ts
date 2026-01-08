import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { serverEnv } from "~/lib/env";

import * as schema from "./schema";

const client = serverEnv.NODE_ENV === "development"
  ? postgres(serverEnv.DATABASE_URL)
  : neon(serverEnv.DATABASE_URL);

const db = serverEnv.NODE_ENV === "development"
  ? drizzle(client as ReturnType<typeof postgres>, { casing: "snake_case", schema })
  : drizzleNeon(client as ReturnType<typeof neon>, { casing: "snake_case", schema });

export { db };
