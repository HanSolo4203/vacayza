import * as cheerio from "cheerio";
import { extractSuburbFromUrl, inferPropertyType, parsePrice } from "./investment";
import { pickBestProperty24Url } from "./property24-images";
import type { PropertyListingData } from "./types";

type CheerioRoot = ReturnType<typeof cheerio.load>;

type JsonLdListing = {
  name?: string;
  description?: string;
  datePosted?: string;
  image?: string | string[];
  about?: {
    numberOfBedrooms?: number;
    numberOfBathroomsTotal?: number;
    floorSize?: { value?: number };
    description?: string;
    address?: { addressLocality?: string };
  };
  offers?: {
    priceSpecification?: { price?: string | number };
  };
};

const MIN_LISTING_PRICE = 50_000;

function parseJsonLd(html: string): JsonLdListing | null {
  const match = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i);
  if (!match) return null;

  try {
    const parsed = JSON.parse(match[1]) as { "@graph"?: JsonLdListing[] } | JsonLdListing;
    const graph = "@graph" in parsed ? parsed["@graph"] : null;
    const item = graph?.find((node) => node?.offers || node?.about) ?? (parsed as JsonLdListing);
    return item ?? null;
  } catch {
    return null;
  }
}

function parseOverview($: CheerioRoot): Record<string, string> {
  const overview: Record<string, string> = {};
  $(".p24_propertyOverviewRow").each((_, row) => {
    const key = $(row).find(".p24_propertyOverviewKey").first().text().trim();
    const value = $(row).find(".p24_info").first().text().trim();
    if (key && value) overview[key] = value;
  });
  return overview;
}

function extractListingPrice(html: string, $: CheerioRoot, overview: Record<string, string>): number {
  const jsonLd = parseJsonLd(html);
  const jsonLdPrice = jsonLd?.offers?.priceSpecification?.price;
  if (jsonLdPrice != null) {
    const price = typeof jsonLdPrice === "number" ? jsonLdPrice : parseInt(String(jsonLdPrice), 10);
    if (price >= MIN_LISTING_PRICE) return price;
  }

  const gtagMatch = html.match(/"listing_price":"([\d.]+)"/);
  if (gtagMatch) {
    const price = Math.round(parseFloat(gtagMatch[1]));
    if (price >= MIN_LISTING_PRICE) return price;
  }

  const domPrice = parsePrice($(".p24_price").first().text());
  if (domPrice >= MIN_LISTING_PRICE) return domPrice;

  const metaDescription = $('meta[name="description"]').attr("content") ?? "";
  const metaPrice = parsePrice(metaDescription);
  if (metaPrice >= MIN_LISTING_PRICE) return metaPrice;

  const floorSize = overview["Floor Size"] ? parseInt(overview["Floor Size"].replace(/[^\d]/g, ""), 10) : 0;
  const pricePerSqm = overview["Price per m²"] ? parsePrice(overview["Price per m²"]) : 0;
  if (floorSize > 0 && pricePerSqm > 0) {
    const calculated = floorSize * pricePerSqm;
    if (calculated >= MIN_LISTING_PRICE) return calculated;
  }

  return 0;
}

function detectListingStatus($: CheerioRoot, title: string): PropertyListingData["listingStatus"] {
  const listingScope = $(".p24_listingCard").first().text();
  const headerScope = $("header.p24_listingCard, .p24_listingFeaturesWrapper header").first().parent().html() ?? "";
  const scan = `${listingScope}\n${headerScope}`;

  if (/under offer/i.test(scan)) return "Under Offer";
  if (/\bon offer\b/i.test(scan)) return "On Offer";
  if (/\bsold\b/i.test(scan) && !/sold house prices|sold prices/i.test(scan)) return "Sold";

  const lowerTitle = title.toLowerCase();
  if (/\bsold\b/.test(lowerTitle) && !/for sale/.test(lowerTitle)) return "Sold";
  if (/under offer/.test(lowerTitle)) return "Under Offer";
  if (/\bon offer\b/.test(lowerTitle)) return "On Offer";
  return "For Sale";
}

function normalizeProperty24ImageUrl(src: string): string | null {
  if (!src.includes("images.prop24.com")) return null;
  const match = src.match(/(https:\/\/images\.prop24\.com\/[^"'\\)\s]+)/i);
  return match?.[1] ?? null;
}

function extractPhotosFromEmbeddedJson(html: string): string[] {
  const urls: string[] = [];
  const patterns = [
    /"originalUrl"\s*:\s*"(https:\/\/images\.prop24\.com\/[^"]+)"/gi,
    /"midSizeImageUrl"\s*:\s*"(https:\/\/images\.prop24\.com\/[^"]+)"/gi,
    /"imageUrl"\s*:\s*"(https:\/\/images\.prop24\.com\/[^"]+)"/gi,
    /"thumbnailUrl"\s*:\s*"(https:\/\/images\.prop24\.com\/[^"]+)"/gi,
    /"(https:\/\/images\.prop24\.com\/\d+(?:\/Ensure\d+x\d+|\/Crop\d+x\d+)?)"/gi,
  ];

  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(html)) !== null) {
      const raw = (match[1] ?? match[0]).replace(/^"+|"+$/g, "");
      const normalized = normalizeProperty24ImageUrl(raw);
      if (normalized) urls.push(normalized);
    }
  }

  return urls;
}

function collectImages($: CheerioRoot, jsonLd: JsonLdListing | null, html: string): string[] {
  const raw: string[] = [];

  const addImage = (src?: string | null) => {
    const normalized = src ? normalizeProperty24ImageUrl(src) : null;
    if (normalized) raw.push(normalized);
  };

  extractPhotosFromEmbeddedJson(html).forEach(addImage);

  if (jsonLd?.image) {
    const jsonImages = Array.isArray(jsonLd.image) ? jsonLd.image : [jsonLd.image];
    jsonImages.forEach(addImage);
  }

  $('[data-lightbox-src]').each((_, el) => addImage($(el).attr("data-lightbox-src")));
  $("[data-image-url]").each((_, el) => addImage($(el).attr("data-image-url")));
  $('meta[property="og:image"]').each((_, el) => addImage($(el).attr("content")));
  $("img[src*='images.prop24.com']").each((_, el) => {
    addImage($(el).attr("src"));
    addImage($(el).attr("data-src"));
  });

  return pickBestProperty24Url(raw);
}

function buildFeatures(overview: Record<string, string>, existing: string[]): string[] {
  const featureKeys = [
    "Listing Number",
    "Listing Date",
    "Type of Property",
    "Street Address",
    "Price per m²",
    "Levies",
    "Rates and Taxes",
    "No Transfer Duty",
    "Pets Allowed",
    "Furnished",
    "Erf Size",
  ];

  const fromOverview = featureKeys
    .filter((key) => overview[key])
    .map((key) => `${key}: ${overview[key]}`);

  const merged = [...fromOverview];
  for (const item of existing) {
    if (!merged.some((entry) => entry.toLowerCase() === item.toLowerCase())) {
      merged.push(item);
    }
  }
  return merged.slice(0, 40);
}

export function scrapeProperty24Listing(
  html: string,
  sourceUrl: string,
): Omit<PropertyListingData, "transferDuty" | "totalAcquisitionCost" | "str" | "ltr" | "recommendation"> {
  const $ = cheerio.load(html);
  const jsonLd = parseJsonLd(html);
  const overview = parseOverview($);

  const ogTitle = $('meta[property="og:title"]').attr("content")?.trim();
  const title =
    jsonLd?.name?.trim() ||
    ogTitle ||
    $("h1.p24_title").first().text().trim() ||
    $(".p24_title").first().text().trim() ||
    "Property Listing";

  const price = extractListingPrice(html, $, overview);

  let address = $(".p24_address").first().text().trim() || overview["Street Address"] || "";
  if (!address && title.includes(" in ")) {
    address = title.split(" in ").slice(1).join(" in ").trim();
  }
  if (!address) {
    address = jsonLd?.about?.address?.addressLocality?.trim() || title;
  }

  const bedrooms =
    jsonLd?.about?.numberOfBedrooms ??
    (parseInt($("[data-listing-number-of-bedrooms]").attr("data-listing-number-of-bedrooms") ?? "", 10) ||
      parseInt(overview["Bedrooms"] ?? "", 10) ||
      (() => {
        let beds = 0;
        $("li, span, div").each((_, el) => {
          const m = $(el).text().match(/(\d+(?:\.\d+)?)\s*bed/i);
          if (m) beds = Math.ceil(parseFloat(m[1]));
        });
        return beds;
      })());

  const bathrooms =
    jsonLd?.about?.numberOfBathroomsTotal ??
    (parseInt($("[data-listing-number-of-bathrooms]").attr("data-listing-number-of-bathrooms") ?? "", 10) ||
      parseInt(overview["Bathrooms"] ?? "", 10) ||
      (() => {
        let baths = 0;
        $("li, span, div").each((_, el) => {
          const m = $(el).text().match(/(\d+(?:\.\d+)?)\s*bath/i);
          if (m) baths = Math.ceil(parseFloat(m[1]));
        });
        return baths;
      })());

  const parking = (() => {
    const fromOverview = parseInt(overview["Garages"] ?? overview["Parking"] ?? "", 10);
    if (fromOverview) return fromOverview;
    let spots = 0;
    $("li, span, div").each((_, el) => {
      const t = $(el).text();
      const m = t.match(/(\d+)\s*(garage|parking)/i);
      if (m) spots = parseInt(m[1], 10);
    });
    return spots;
  })();

  const size =
    jsonLd?.about?.floorSize?.value ??
    (parseInt(overview["Floor Size"]?.replace(/[^\d]/g, "") ?? "", 10) ||
      (() => {
        let sqm = 0;
        $("li, span, div, p").each((_, el) => {
          const m = $(el).text().match(/([\d,]+)\s*m²/i);
          if (m) sqm = parseInt(m[1].replace(/,/g, ""), 10);
        });
        return sqm;
      })());

  const description =
    $(".p24_description").first().text().trim() ||
    jsonLd?.description?.trim() ||
    $("div.p24_listingDescription, div[class*='description']").first().text().trim() ||
    $('meta[name="description"]').attr("content")?.trim() ||
    "";

  const rawFeatures: string[] = [];
  $(".p24_featureDetails li, .p24_features li, [class*='feature'] li").each((_, el) => {
    const text = $(el).text().trim();
    if (text && text.length < 120) rawFeatures.push(text);
  });

  const propertyType =
    overview["Type of Property"] || jsonLd?.about?.description || inferPropertyType(title, bedrooms);
  const listingStatus = detectListingStatus($, title);
  const images = collectImages($, jsonLd, html);
  const suburb = extractSuburbFromUrl(sourceUrl);

  return {
    sourceUrl,
    title,
    address,
    suburb,
    price,
    bedrooms,
    bathrooms,
    parking,
    size,
    propertyType,
    description,
    images,
    features: buildFeatures(overview, rawFeatures),
    listingStatus,
    listingNumber: overview["Listing Number"],
    listingDate: overview["Listing Date"],
    levies: overview["Levies"] ? parsePrice(overview["Levies"]) : undefined,
    ratesAndTaxes: overview["Rates and Taxes"] ? parsePrice(overview["Rates and Taxes"]) : undefined,
    pricePerSqm: overview["Price per m²"] ? parsePrice(overview["Price per m²"]) : undefined,
    noTransferDuty: overview["No Transfer Duty"]?.toLowerCase() === "yes",
  };
}
