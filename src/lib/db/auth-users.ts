import { sql } from "drizzle-orm";
import { getDb } from "./index";

// Neon Auth owns the `neon_auth` schema, so this is a read-only peek rather
// than a Drizzle-managed table.
export async function getEmailForAuthUser(
  authUserId: string,
): Promise<string | null> {
  const result = await getDb().execute<{ email: string | null }>(
    sql`select email from neon_auth."user" where id = ${authUserId}::uuid limit 1`,
  );

  const rows = Array.isArray(result) ? result : (result.rows ?? []);
  return rows[0]?.email ?? null;
}

export async function getAuthUserIdByEmail(
  email: string,
): Promise<string | null> {
  const result = await getDb().execute<{ id: string }>(
    sql`select id::text as id from neon_auth."user" where email = ${email} limit 1`,
  );

  const rows = Array.isArray(result) ? result : (result.rows ?? []);
  return rows[0]?.id ?? null;
}
