/** Use a configured public URL in production; never trust forwarded host headers. */
export function authOrigin(requestUrl: string, siteUrl?: string) {
  const url = new URL(siteUrl || requestUrl);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("The site URL must use HTTP or HTTPS");
  }
  return url.origin;
}

export function safeAuthPath(value: string | null, origin: string) {
  if (
    !value?.startsWith("/") ||
    value.startsWith("//") ||
    /[\\\u0000-\u0020\u007f]/.test(value)
  )
    return "/";
  try {
    const url = new URL(value, origin);
    return url.origin === origin ? url.pathname + url.search + url.hash : "/";
  } catch {
    return "/";
  }
}
