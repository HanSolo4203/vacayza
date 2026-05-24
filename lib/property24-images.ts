/** Property24 image CDN helpers. Listings use Ensure* and Crop320x213 — not legacy Crop676x507 paths. */

export type Property24ImageSize = "hero" | "gallery" | "thumb";

function assetId(src: string): string | null {
  return src.match(/images\.prop24\.com\/([^/?#]+)/i)?.[1] ?? null;
}

function baseUrl(src: string): string {
  const id = assetId(src);
  return id ? `https://images.prop24.com/${id}` : src;
}

export function urlRank(src: string): number {
  if (/\/Ensure1280x720/i.test(src)) return 100;
  if (/\/Ensure960x540/i.test(src)) return 90;
  if (/\/Crop676x507/i.test(src)) return 80;
  if (/\/Crop320x213/i.test(src)) return 70;
  if (/\/Crop107x80/i.test(src)) return 60;
  if (!/\/(Crop|Ensure|Fit|UpperCrop)/i.test(src)) return 50;
  return 40;
}

/** Pick the best stored/scraped URL, or build a sized URL from the asset id. */
export function toProperty24DisplayUrl(
  src: string,
  size: Property24ImageSize = "gallery",
): string {
  if (!src.includes("images.prop24.com")) return src;
  if (/\/(Crop|Ensure|Fit|UpperCrop)/i.test(src)) return src;

  const base = baseUrl(src);
  if (size === "thumb") return `${base}/Ensure960x540`;
  return `${base}/Ensure1280x720`;
}

export function property24ProxyUrl(url: string): string {
  return `/api/image-proxy?url=${encodeURIComponent(url)}`;
}

/** Fallback chain when a CDN variant 404s or is blocked. */
export function property24FallbackUrls(src: string, size: Property24ImageSize = "gallery"): string[] {
  if (!src.includes("images.prop24.com")) return [src];

  const base = baseUrl(src);
  const primary = toProperty24DisplayUrl(src, size);
  const direct = [
    primary,
    `${base}/Ensure1280x720`,
    `${base}/Ensure960x540`,
    `${base}/Crop320x213`,
    src,
    base,
  ];

  const unique = [...new Set(direct.filter(Boolean))];
  return [...new Set([...unique.map(property24ProxyUrl), ...unique])];
}

export function pickBestProperty24Url(urls: string[]): string[] {
  const byId = new Map<string, string>();

  for (const raw of urls) {
    if (!raw?.includes("images.prop24.com")) continue;
    const cleaned = raw.match(/(https:\/\/images\.prop24\.com\/[^"'\\)\s]+)/i)?.[1];
    if (!cleaned) continue;
    const id = assetId(cleaned);
    if (!id) continue;
    const existing = byId.get(id);
    if (!existing || urlRank(cleaned) > urlRank(existing)) {
      byId.set(id, cleaned);
    }
  }

  return Array.from(byId.values());
}
