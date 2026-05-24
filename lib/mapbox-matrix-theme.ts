import type mapboxgl from "mapbox-gl";

/** Classic Matrix terminal green */
export const MATRIX_GREEN = "#00ff41";
export const MATRIX_GREEN_DIM = "#1a6640";
export const MATRIX_GREEN_GLOW = "#66ff99";
export const MATRIX_BLACK = "#0f1f18";

/** Lighter green-tinted basemap — readable streets/buildings, still Matrix */
export const MATRIX_LAND = "#1a2e26";
export const MATRIX_BUILDINGS = "#3d5c4f";
export const MATRIX_ROADS = "#2a4a3a";

function lerpColor(a: [number, number, number], b: [number, number, number], t: number): string {
  const r = Math.round(a[0] + (b[0] - a[0]) * t);
  const g = Math.round(a[1] + (b[1] - a[1]) * t);
  const bl = Math.round(a[2] + (b[2] - a[2]) * t);
  return `#${[r, g, bl].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

const BRIGHT_RGB: [number, number, number] = [0, 255, 65];
const DIM_RGB: [number, number, number] = [0, 120, 48];
const MID_RGB: [number, number, number] = [0, 220, 72];
const GLOW_RGB: [number, number, number] = [120, 255, 170];

export interface BuildingPulseTarget {
  /** Custom fill-extrusion layer id to animate (matrix glow overlay). */
  layerId?: string;
}

let pulseFrameId: number | null = null;
let pulseStartMs = 0;
let pulseTarget: BuildingPulseTarget | null = null;

/** Mapbox Standard → green-tinted Matrix aesthetic (legible, not pitch black) */
export function applyMatrixTheme(map: mapboxgl.Map) {
  const set = (key: string, value: string | boolean | number) => {
    try {
      map.setConfigProperty("basemap", key, value);
    } catch {
      /* ignore unsupported config on older tokens */
    }
  };

  set("lightPreset", "dusk");
  set("theme", "monochrome");
  set("colorLand", MATRIX_LAND);
  set("colorWater", "#1a3830");
  set("colorGreenspace", "#243d32");
  set("colorBuildings", MATRIX_BUILDINGS);
  set("colorCommercial", "#455a50");
  set("colorIndustrial", "#3d5248");
  set("colorEducation", "#42564c");
  set("colorMedical", "#42564c");
  set("colorMotorways", "#3d6b52");
  set("colorTrunks", "#356048");
  set("colorRoads", MATRIX_ROADS);
  set("colorRoadLabels", MATRIX_GREEN);
  set("colorPlaceLabels", MATRIX_GREEN);
  set("colorPointOfInterestLabels", MATRIX_GREEN_DIM);
  set("colorAdminBoundaries", "#2a5040");
  set("colorBuildingSelect", MATRIX_GREEN);
  set("colorBuildingHighlight", MATRIX_GREEN_GLOW);
  set("colorPlaceLabelSelect", MATRIX_GREEN);
  set("show3dTrees", false);
  set("densityPointOfInterestLabels", 2);
}

/** Oscillate selected-building tint between dim and bright Matrix green */
export function startBuildingColorPulse(map: mapboxgl.Map, target: BuildingPulseTarget = {}) {
  stopBuildingColorPulse();
  pulseStartMs = 0;
  pulseTarget = target;

  const tick = (now: number) => {
    if (!pulseStartMs) pulseStartMs = now;
    const elapsed = now - pulseStartMs;
    // Sharp matrix pulse: fast sine + subtle terminal flicker
    const phase = (Math.sin(elapsed / 520) + 1) / 2;
    const flicker = 0.92 + 0.08 * Math.sin(elapsed / 95);
    const intensity = Math.min(1, phase * flicker);

    const selectColor = lerpColor(DIM_RGB, BRIGHT_RGB, intensity);
    const highlightColor = lerpColor(MID_RGB, GLOW_RGB, Math.min(1, intensity * 1.2));

    try {
      map.setConfigProperty("basemap", "colorBuildingSelect", selectColor);
      map.setConfigProperty("basemap", "colorBuildingHighlight", highlightColor);

      const layerId = pulseTarget?.layerId;
      if (layerId && map.getLayer(layerId)) {
        map.setPaintProperty(layerId, "fill-extrusion-color", selectColor);
        map.setPaintProperty(layerId, "fill-extrusion-opacity", 0.55 + intensity * 0.45);
      }
    } catch {
      stopBuildingColorPulse();
      return;
    }

    pulseFrameId = requestAnimationFrame(tick);
  };

  pulseFrameId = requestAnimationFrame(tick);
}

export function stopBuildingColorPulse() {
  if (pulseFrameId != null) {
    cancelAnimationFrame(pulseFrameId);
    pulseFrameId = null;
  }
  pulseStartMs = 0;
  pulseTarget = null;
}
