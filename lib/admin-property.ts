import { revalidatePath } from "next/cache";
import { slugifyAddress } from "./format";
import { createSupabaseClientSafe } from "./supabase";

export function getSupabaseAdmin() {
  const supabase = createSupabaseClientSafe();
  if (!supabase) {
    throw new Error("Supabase is not configured. Add env variables.");
  }
  return supabase;
}

export async function generateUniqueSlug(address: string, excludeId?: string): Promise<string> {
  const supabase = getSupabaseAdmin();
  const base = slugifyAddress(address) || "property";
  let slug = base;
  let suffix = 2;

  while (true) {
    let query = supabase.from("property_listings").select("id").eq("slug", slug);
    if (excludeId) query = query.neq("id", excludeId);
    const { data } = await query.maybeSingle();
    if (!data) return slug;
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
}

export function revalidatePropertyPaths(slug: string) {
  revalidatePath("/");
  revalidatePath("/properties");
  revalidatePath(`/properties/${slug}`);
  revalidatePath("/admin");
}
