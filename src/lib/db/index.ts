import { Pool } from "@neondatabase/serverless";
import { drizzle as drizzleNeonWs } from "drizzle-orm/neon-serverless";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { serverEnv } from "~/lib/env";

import * as schema from "./schema";

function createDb() {
  if (serverEnv.NODE_ENV === "development") {
    const client = postgres(serverEnv.DATABASE_URL);
    return drizzlePostgres({ client, casing: "snake_case", schema });
  }

  // Use Pool (WebSocket) instead of neon (HTTP) for transaction support
  const pool = new Pool({
    connectionString: serverEnv.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 20000,
    connectionTimeoutMillis: 10000,
  });

  return drizzleNeonWs({ client: pool, casing: "snake_case", schema });
}

export const db = createDb();
