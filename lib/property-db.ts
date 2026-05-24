import { createSupabaseClientSafe } from "./supabase";
import type { LtrData, Recommendation, StrData } from "./types";

export interface PropertyRecord {
  id: string;
  created_at: string;
  source_url: string;
  title: string | null;
  address: string | null;
  suburb: string | null;
  price: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  parking: number | null;
  size_sqm: number | null;
  property_type: string | null;
  description: string | null;
  images: string[] | null;
  features: string[] | null;
  transfer_duty: number | null;
  total_acquisition_cost: number | null;
  str_data: StrData | null;
  ltr_data: LtrData | null;
  recommendation: Recommendation | null;
  listing_status: string | null;
  slug: string;
  published: boolean;
  agent_notes: string | null;
  vacayza_score: number | null;
  levies: number | null;
  rates_and_taxes: number | null;
}

export async function getPublishedProperties(): Promise<PropertyRecord[]> {
  const supabase = createSupabaseClientSafe();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("property_listings")
    .select("*")
    .eq("published", true)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data as PropertyRecord[];
}

export async function getAllProperties(): Promise<PropertyRecord[]> {
  const supabase = createSupabaseClientSafe();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("property_listings")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data as PropertyRecord[];
}

export async function getPropertyById(id: string): Promise<PropertyRecord | null> {
  const supabase = createSupabaseClientSafe();
  if (!supabase) return null;

  const { data, error } = await supabase.from("property_listings").select("*").eq("id", id).maybeSingle();

  if (error || !data) return null;
  return data as PropertyRecord;
}

export async function getPropertyBySlug(slug: string): Promise<PropertyRecord | null> {
  const supabase = createSupabaseClientSafe();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("property_listings")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();

  if (error || !data) return null;
  return data as PropertyRecord;
}

export async function getPropertyBySourceUrl(sourceUrl: string): Promise<PropertyRecord | null> {
  const supabase = createSupabaseClientSafe();
  if (!supabase || !sourceUrl) return null;

  const { data, error } = await supabase
    .from("property_listings")
    .select("*")
    .eq("source_url", sourceUrl)
    .maybeSingle();

  if (error || !data) return null;
  return data as PropertyRecord;
}
