import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

type Database = ReturnType<typeof drizzle<typeof schema>>;

let cached: Database | null = null;

export function getDb(): Database {
  if (cached) return cached;

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }

  cached = drizzle({ client: neon(url), schema });
  return cached;
}
