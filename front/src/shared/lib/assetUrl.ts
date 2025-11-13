const ASSET_BASE =
  (import.meta.env.VITE_ASSET_BASE_URL as string | undefined)?.replace(/\/$/, "") ??
  (() => {
    const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:8080/api";
    try {
      return new URL(apiUrl).origin;
    } catch {
      if (typeof window !== "undefined" && window.location?.origin) {
        return window.location.origin;
      }
      return "";
    }
  })();

const isAbsoluteUrl = (url: string) =>
  /^([a-z][a-z\d+\-.]*:)?\/\//i.test(url) || url.startsWith("data:") || url.startsWith("blob:");

export const resolveAssetUrl = (url?: string | null) => {
  if (!url) return "";
  if (isAbsoluteUrl(url)) return url;
  if (!ASSET_BASE) return url;
  const normalized = url.startsWith("/") ? url : `/${url}`;
  return `${ASSET_BASE}${normalized}`;
};
