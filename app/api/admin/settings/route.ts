import { NextRequest, NextResponse } from "next/server";
import { getMaintenanceReservePct, setMaintenanceReservePct } from "../../../../lib/app-settings";

export async function GET() {
  try {
    const maintenanceReservePct = await getMaintenanceReservePct();
    return NextResponse.json({ success: true, maintenanceReservePct });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load settings.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const pct = Number(body.maintenanceReservePct);
    if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
      return NextResponse.json(
        { success: false, error: "Maintenance reserve must be between 0 and 100." },
        { status: 400 },
      );
    }

    const maintenanceReservePct = await setMaintenanceReservePct(pct);
    return NextResponse.json({ success: true, maintenanceReservePct });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save settings.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
