// Links built from API data (event pages, post sources, media) must never
// become `javascript:` or `data:` URLs: they run in the hub origin, where the
// JWT pair lives in localStorage. Returns the URL for http(s) or a same-origin
// relative path, else undefined.
export function safeHttpUrl(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  try {
    const { protocol } = new URL(value, "https://invalid.example");
    return protocol === "http:" || protocol === "https:" ? value : undefined;
  } catch {
    return undefined;
  }
}
