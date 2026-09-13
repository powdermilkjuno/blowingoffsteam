import { syncAllLinkedPlaytime } from "@/lib/playtime-sync";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const auth = request.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;

  // Vercel Cron sends this header on scheduled invocations.
  const cronHeader = request.headers.get("x-vercel-cron");
  return cronHeader === "1" && auth === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await syncAllLinkedPlaytime();
  return Response.json({ ok: true, ...result });
}
