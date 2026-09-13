import { NextResponse } from "next/server";
import { getUserBySteamId } from "@/lib/db/users";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const user = await getUserBySteamId(session.steamId);
  if (!user) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({
    name: user.name,
    id: user.id,
    avatarUrl: user.avatarUrl,
    playtimeMinutes: user.playtimeMinutes,
    playtimePublic: user.playtimePublic,
  });
}
