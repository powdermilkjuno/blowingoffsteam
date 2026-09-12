const STEAM_OPENID_URL = "https://steamcommunity.com/openid/login";
const STEAM_ID_RE =
  /^https?:\/\/steamcommunity\.com\/openid\/id\/(\d+)$/;

export function extractSteamId64(claimedId: string): string | null {
  const match = claimedId.trim().match(STEAM_ID_RE);
  return match?.[1] ?? null;
}

export function buildSteamLoginUrl(appUrl: string): string {
  const returnTo = `${appUrl}/auth/steam/callback`;
  const params = new URLSearchParams({
    "openid.ns": "http://specs.openid.net/auth/2.0",
    "openid.mode": "checkid_setup",
    "openid.return_to": returnTo,
    "openid.realm": appUrl,
    "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
    "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
  });

  return `${STEAM_OPENID_URL}?${params.toString()}`;
}

export async function verifySteamOpenId(
  searchParams: URLSearchParams,
  appUrl: string,
): Promise<string | null> {
  const claimedId = searchParams.get("openid.claimed_id");
  const identity = searchParams.get("openid.identity");
  const returnTo = searchParams.get("openid.return_to");
  const mode = searchParams.get("openid.mode");

  if (mode !== "id_res" || !claimedId || !returnTo) {
    return null;
  }

  const expectedReturnTo = `${appUrl}/auth/steam/callback`;
  if (!returnTo.startsWith(expectedReturnTo)) {
    return null;
  }

  const steamId = extractSteamId64(claimedId);
  if (!steamId) return null;
  if (identity && extractSteamId64(identity) !== steamId) {
    return null;
  }

  const verifyParams = new URLSearchParams();
  for (const [key, value] of searchParams.entries()) {
    if (key.startsWith("openid.")) {
      verifyParams.set(key, value);
    }
  }
  verifyParams.set("openid.mode", "check_authentication");

  const res = await fetch(STEAM_OPENID_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: verifyParams.toString(),
    cache: "no-store",
  });

  if (!res.ok) return null;

  const text = await res.text();
  const isValid = text
    .split(/\r?\n/)
    .some((line) => line.trim() === "is_valid:true");

  return isValid ? steamId : null;
}
