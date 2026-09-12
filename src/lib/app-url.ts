export function getAppUrl(request: Request): string {
  const configured = process.env.APP_URL?.replace(/\/$/, "");
  if (configured) return configured;

  const url = new URL(request.url);
  const proto =
    request.headers.get("x-forwarded-proto") ??
    url.protocol.replace(":", "");
  const host =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    url.host;

  return `${proto}://${host}`;
}
