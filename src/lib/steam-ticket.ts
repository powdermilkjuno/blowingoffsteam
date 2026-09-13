import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

// Short-lived proof that this browser just completed Steam OpenID. It is not a
// login: the account does not exist yet when the ticket is issued.
export const STEAM_TICKET_COOKIE = "bos_steam_ticket";
const MAX_AGE_SECONDS = 10 * 60;

export type SteamTicket = {
  steamId: string;
  displayName: string;
  avatarUrl: string;
  profileUrl: string;
  issuedAt: number;
};

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET is not set");
  }
  return secret;
}

export function encodeTicket(ticket: SteamTicket): string {
  const payload = Buffer.from(JSON.stringify(ticket), "utf8").toString(
    "base64url",
  );
  const sig = createHmac("sha256", getSecret())
    .update(payload)
    .digest("base64url");
  return `${payload}.${sig}`;
}

export function decodeTicket(signed: string): SteamTicket | null {
  const lastDot = signed.lastIndexOf(".");
  if (lastDot === -1) return null;

  const payload = signed.slice(0, lastDot);
  const sig = signed.slice(lastDot + 1);
  const expected = createHmac("sha256", getSecret())
    .update(payload)
    .digest("base64url");

  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expected);
  if (sigBuf.length !== expectedBuf.length) return null;
  if (!timingSafeEqual(sigBuf, expectedBuf)) return null;

  try {
    const ticket = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (typeof ticket?.steamId !== "string") return null;

    const issuedAt = Number(ticket.issuedAt) || 0;
    if (Date.now() - issuedAt > MAX_AGE_SECONDS * 1000) return null;

    return {
      steamId: ticket.steamId,
      displayName:
        typeof ticket.displayName === "string" ? ticket.displayName : "Steam User",
      avatarUrl: typeof ticket.avatarUrl === "string" ? ticket.avatarUrl : "",
      profileUrl: typeof ticket.profileUrl === "string" ? ticket.profileUrl : "",
      issuedAt,
    };
  } catch {
    return null;
  }
}

export function ticketCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  };
}

export function clearedTicketCookieOptions() {
  return { ...ticketCookieOptions(), maxAge: 0 };
}

export async function getSteamTicket(): Promise<SteamTicket | null> {
  const store = await cookies();
  const raw = store.get(STEAM_TICKET_COOKIE)?.value;
  if (!raw) return null;

  try {
    return decodeTicket(raw);
  } catch {
    return null;
  }
}
