import type mapboxgl from "mapbox-gl";
import type { Feature, Geometry } from "geojson";
import {
  applyMatrixTheme,
  MATRIX_GREEN,
  startBuildingColorPulse,
  stopBuildingColorPulse,
} from "./mapbox-matrix-theme";

const BUILDING_TARGET = { featuresetId: "buildings", importId: "basemap" } as const;
export const PULSE_BUILDING_LAYER_ID = "vacayza-building-pulse";
export const PULSE_BUILDING_SOURCE_ID = "vacayza-building-pulse-src";

export function configureMapTheme(map: mapboxgl.Map) {
  applyMatrixTheme(map);
}

function buildingHeight(feature: mapboxgl.TargetFeature): number {
  const props = feature.properties ?? {};
  const h = props.height ?? props.render_height ?? props.min_height ?? 0;
  return typeof h === "number" ? h : Number(h) || 0;
}

function buildingMinHeight(feature: mapboxgl.TargetFeature): number {
  const props = feature.properties ?? {};
  const h = props.min_height ?? props.render_min_height ?? 0;
  return typeof h === "number" ? h : Number(h) || 0;
}

function featureGeometry(feature: mapboxgl.TargetFeature): Geometry | null {
  const geometry = (feature as Feature).geometry;
  return geometry ?? null;
}

function removeBuildingPulseLayer(map: mapboxgl.Map) {
  try {
    if (map.getLayer(PULSE_BUILDING_LAYER_ID)) map.removeLayer(PULSE_BUILDING_LAYER_ID);
    if (map.getSource(PULSE_BUILDING_SOURCE_ID)) map.removeSource(PULSE_BUILDING_SOURCE_ID);
  } catch {
    /* Style may be unloading */
  }
}

function fallbackFootprint(lng: number, lat: number): Feature {
  const d = 0.00012;
  return {
    type: "Feature",
    id: "vacayza-pulse-building",
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [lng - d, lat - d],
          [lng + d, lat - d],
          [lng + d, lat + d],
          [lng - d, lat + d],
          [lng - d, lat - d],
        ],
      ],
    },
    properties: { height: 28, min_height: 0 },
  };
}

function featureToPulseGeoJSON(
  feature: mapboxgl.TargetFeature,
  lng: number,
  lat: number,
): Feature {
  const geometry = featureGeometry(feature);
  if (!geometry) return fallbackFootprint(lng, lat);

  const height = buildingHeight(feature);
  return {
    type: "Feature",
    id: "vacayza-pulse-building",
    geometry,
    properties: {
      height: height > 0 ? height : 24,
      min_height: buildingMinHeight(feature),
    },
  };
}

function syncBuildingPulseLayer(
  map: mapboxgl.Map,
  feature: mapboxgl.TargetFeature | null,
  lng: number,
  lat: number,
) {
  removeBuildingPulseLayer(map);

  const pulseFeature = feature
    ? featureToPulseGeoJSON(feature, lng, lat)
    : fallbackFootprint(lng, lat);

  map.addSource(PULSE_BUILDING_SOURCE_ID, {
    type: "geojson",
    data: { type: "FeatureCollection", features: [pulseFeature] },
  });

  map.addLayer({
    id: PULSE_BUILDING_LAYER_ID,
    type: "fill-extrusion",
    source: PULSE_BUILDING_SOURCE_ID,
    paint: {
      "fill-extrusion-color": MATRIX_GREEN,
      "fill-extrusion-height": ["get", "height"],
      "fill-extrusion-base": ["get", "min_height"],
      "fill-extrusion-opacity": 0.92,
      "fill-extrusion-vertical-gradient": false,
    },
  });
}

export function clearBuildingHighlight(
  map: mapboxgl.Map,
  feature: mapboxgl.TargetFeature | null,
) {
  stopBuildingColorPulse();
  removeBuildingPulseLayer(map);
  if (!feature) return;
  try {
    map.removeFeatureState(feature, "select");
    map.removeFeatureState(feature, "highlight");
  } catch {
    /* Feature may have unloaded between tiles */
  }
}

/**
 * Select the 3D building under a lng/lat and overlay a pulsing Matrix-green extrusion.
 */
export function highlightBuildingAtPoint(
  map: mapboxgl.Map,
  lng: number,
  lat: number,
): mapboxgl.TargetFeature | null {
  configureMapTheme(map);

  const point = map.project([lng, lat]);
  const pad = 36;
  const features = map.queryRenderedFeatures(
    [
      [point.x - pad, point.y - pad],
      [point.x + pad, point.y + pad],
    ],
    { target: BUILDING_TARGET },
  ) as mapboxgl.TargetFeature[];

  if (!features.length) {
    syncBuildingPulseLayer(map, null, lng, lat);
    startBuildingColorPulse(map, { layerId: PULSE_BUILDING_LAYER_ID });
    return null;
  }

  const building = features.reduce((best, f) =>
    buildingHeight(f) > buildingHeight(best) ? f : best,
  );

  map.setFeatureState(building, { select: true, highlight: true });
  syncBuildingPulseLayer(map, building, lng, lat);
  startBuildingColorPulse(map, { layerId: PULSE_BUILDING_LAYER_ID });
  return building;
}

/** Retry after tiles and 3D buildings finish loading (post flyTo). */
export function highlightBuildingWhenReady(
  map: mapboxgl.Map,
  lng: number,
  lat: number,
  onSelected: (feature: mapboxgl.TargetFeature | null) => void,
) {
  let attempts = 0;
  const maxAttempts = 12;

  const tryHighlight = () => {
    attempts += 1;
    const feature = highlightBuildingAtPoint(map, lng, lat);
    const hasPulse = Boolean(map.getLayer(PULSE_BUILDING_LAYER_ID));
    if (feature || hasPulse || attempts >= maxAttempts) {
      onSelected(feature);
      return;
    }
    window.setTimeout(() => {
      if (map.isStyleLoaded()) tryHighlight();
    }, 400);
  };

  if (map.isStyleLoaded() && map.areTilesLoaded()) {
    tryHighlight();
  } else {
    map.once("idle", tryHighlight);
  }
}

export { MATRIX_GREEN, stopBuildingColorPulse };
