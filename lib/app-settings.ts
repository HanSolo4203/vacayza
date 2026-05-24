import { createSupabaseClientSafe } from "./supabase";

export const DEFAULT_MAINTENANCE_RESERVE_PCT = 5;

const SETTINGS_KEY = "maintenance_reserve_pct";

export async function getMaintenanceReservePct(): Promise<number> {
  const supabase = createSupabaseClientSafe();
  if (!supabase) return DEFAULT_MAINTENANCE_RESERVE_PCT;

  const { data, error } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", SETTINGS_KEY)
    .maybeSingle();

  if (error || !data?.value) return DEFAULT_MAINTENANCE_RESERVE_PCT;

  const pct = Number(data.value);
  if (!Number.isFinite(pct) || pct < 0 || pct > 100) return DEFAULT_MAINTENANCE_RESERVE_PCT;
  return pct;
}

export async function setMaintenanceReservePct(pct: number): Promise<number> {
  const clamped = Math.min(100, Math.max(0, pct));
  const supabase = createSupabaseClientSafe();
  if (!supabase) throw new Error("Supabase is not configured.");

  const { error } = await supabase.from("app_settings").upsert(
    {
      key: SETTINGS_KEY,
      value: clamped,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" },
  );

  if (error) throw new Error(error.message);
  return clamped;
}
