const MIN_VALID_HTML_LENGTH = 5_000;

const BROWSER_HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-ZA,en-GB;q=0.9,en-US;q=0.8,en;q=0.7",
  "Cache-Control": "no-cache",
  Pragma: "no-cache",
  "Upgrade-Insecure-Requests": "1",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Sec-Fetch-User": "?1",
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function normalizeProperty24Url(url: string): string {
  const trimmed = url.trim();
  const withProtocol = trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
  const parsed = new URL(withProtocol);

  if (!parsed.hostname.includes("property24.com")) {
    throw new Error("Please provide a valid Property24 URL.");
  }

  parsed.hash = "";
  return parsed.toString();
}

export function isValidListingHtml(html: string): boolean {
  if (html.length < MIN_VALID_HTML_LENGTH) return false;
  if (/server unavailable|please check back later/i.test(html)) return false;

  return (
    html.includes("p24_price") ||
    html.includes("listing_price") ||
    html.includes("application/ld+json") ||
    html.includes("p24_propertyOverviewRow")
  );
}

async function fetchDirect(url: string, referer?: string): Promise<string> {
  const headers = {
    ...BROWSER_HEADERS,
    ...(referer ? { Referer: referer, "Sec-Fetch-Site": "same-origin" } : {}),
  };

  const response = await fetch(url, {
    headers,
    redirect: "follow",
    cache: "no-store",
  });

  return response.text();
}

async function fetchViaReaderProxy(url: string): Promise<string> {
  const headers: Record<string, string> = {
    Accept: "text/html,application/xhtml+xml",
    "x-respond-with": "html",
    "x-timeout": "30",
  };

  const apiKey = process.env.JINA_API_KEY?.trim();
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  const response = await fetch(`https://r.jina.ai/${url}`, {
    headers,
    redirect: "follow",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Proxy fetch failed with status ${response.status}.`);
  }

  const html = await response.text();
  if (!isValidListingHtml(html)) {
    throw new Error("Proxy fetch returned an invalid listing page.");
  }

  return html;
}

export async function fetchProperty24ListingHtml(url: string): Promise<string> {
  const normalizedUrl = normalizeProperty24Url(url);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      if (attempt === 0) {
        await fetchDirect("https://www.property24.com/").catch(() => undefined);
      }

      const html = await fetchDirect(
        normalizedUrl,
        attempt > 0 ? "https://www.property24.com/" : undefined,
      );

      if (isValidListingHtml(html)) {
        return html;
      }
    } catch {
      // Retry below.
    }

    if (attempt < 2) {
      await sleep(800 * (attempt + 1));
    }
  }

  return fetchViaReaderProxy(normalizedUrl);
}
