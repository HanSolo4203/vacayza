"use client";

import { useEffect, useRef, useState } from "react";
import type mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  clearBuildingHighlight,
  configureMapTheme,
  highlightBuildingWhenReady,
  MATRIX_GREEN,
  stopBuildingColorPulse,
} from "../lib/mapbox-building-highlight";
import { mapGeocodeQuery } from "../lib/street-address";

export interface PropertyMap3DProps {
  address: string;
  latitude: number | null;
  longitude: number | null;
  propertyTitle: string;
  price: number;
  suburbDisplay?: string;
  propertyId?: string;
  variant?: "full" | "preview";
  draggable?: boolean;
  onCoordsChange?: (lat: number, lng: number) => void;
  /** When false, only show a map if latitude/longitude are already set (admin manual locate). */
  autoGeocode?: boolean;
}

const PULSE_STYLE_ID = "vacayza-map-pulse-keyframes";

function ensurePulseKeyframes() {
  if (typeof document === "undefined" || document.getElementById(PULSE_STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = PULSE_STYLE_ID;
  style.textContent = `
    @keyframes vacayza-map-pulse {
      0% { box-shadow: 0 0 0 0 rgba(0, 255, 65, 0.75); }
      70% { box-shadow: 0 0 0 16px rgba(0, 255, 65, 0); }
      100% { box-shadow: 0 0 0 0 rgba(0, 255, 65, 0); }
    }
  `;
  document.head.appendChild(style);
}

function createMarkerElement(draggable: boolean): HTMLDivElement {
  const el = document.createElement("div");
  el.style.cssText = `
    width: 20px;
    height: 20px;
    background: ${MATRIX_GREEN};
    border: 3px solid #0a0a0a;
    border-radius: 50%;
    box-shadow: 0 0 0 0 rgba(0, 255, 65, 0.75);
    animation: vacayza-map-pulse 2s infinite;
    cursor: ${draggable ? "grab" : "pointer"};
  `;
  return el;
}

export default function PropertyMap3D({
  address,
  latitude: initialLat,
  longitude: initialLng,
  propertyTitle,
  price,
  suburbDisplay = "Cape Town",
  propertyId,
  variant = "full",
  draggable = false,
  onCoordsChange,
  autoGeocode = true,
}: PropertyMap3DProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const mapInitializedRef = useRef(false);
  const coordsRef = useRef<{ lat: number; lng: number } | null>(null);
  const selectedBuildingRef = useRef<mapboxgl.TargetFeature | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    initialLat != null && initialLng != null ? { lat: initialLat, lng: initialLng } : null,
  );
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState(false);

  const isPreview = variant === "preview";
  const heightClass = isPreview ? "h-[200px]" : "h-[350px] md:h-[500px]";

  useEffect(() => {
    if (initialLat != null && initialLng != null) {
      setCoords({ lat: initialLat, lng: initialLng });
    }
  }, [initialLat, initialLng]);

  useEffect(() => {
    if (!autoGeocode || coords || !address || geocoding) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) return;

    let cancelled = false;

    async function resolveCoords() {
      setGeocoding(true);
      setGeocodeError(false);

      try {
        const query = encodeURIComponent(mapGeocodeQuery(address));
        const res = await fetch(
          `https://api.mapbox.com/search/geocode/v6/forward?q=${query}&country=ZA&proximity=18.4241,-33.9249&access_token=${token}`,
        );
        const json = (await res.json()) as {
          features?: Array<{ geometry?: { coordinates?: [number, number] } }>;
        };
        const featureCoords = json.features?.[0]?.geometry?.coordinates;
        if (!featureCoords || cancelled) return;

        const [lng, lat] = featureCoords;
        setCoords({ lat, lng });

        if (propertyId) {
          await fetch("/api/update-property-coords", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ propertyId, latitude: lat, longitude: lng }),
          });
        }
      } catch {
        if (!cancelled) setGeocodeError(true);
      } finally {
        if (!cancelled) setGeocoding(false);
      }
    }

    resolveCoords();
    return () => {
      cancelled = true;
    };
  }, [address, autoGeocode, coords, geocoding, propertyId]);

  useEffect(() => {
    coordsRef.current = coords;
  }, [coords]);

  useEffect(() => {
    if (!coords || !mapContainer.current || mapInitializedRef.current) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) return;

    let map: mapboxgl.Map | null = null;
    let marker: mapboxgl.Marker | null = null;
    let popup: mapboxgl.Popup | null = null;
    let cancelled = false;

    const applyBuildingHighlight = (m: mapboxgl.Map, longitude: number, latitude: number) => {
      if (selectedBuildingRef.current) {
        clearBuildingHighlight(m, selectedBuildingRef.current);
        selectedBuildingRef.current = null;
      }
      highlightBuildingWhenReady(m, longitude, latitude, (feature) => {
        if (!cancelled) selectedBuildingRef.current = feature;
      });
    };

    ensurePulseKeyframes();
    mapInitializedRef.current = true;

    const { lat, lng } = coords;
    const initialZoom = isPreview ? 14 : 15;
    const initialPitch = isPreview ? 45 : 60;
    const initialBearing = isPreview ? 0 : -20;
    const flyZoom = isPreview ? 14 : 17;
    const flyPitch = isPreview ? 45 : 65;
    const flyBearing = isPreview ? 0 : 30;

    import("mapbox-gl").then((mapboxModule) => {
      if (cancelled || !mapContainer.current) return;

      const mapboxgl = mapboxModule.default;
      mapboxgl.accessToken = token;

      map = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/standard",
        center: [lng, lat],
        zoom: initialZoom,
        pitch: initialPitch,
        bearing: initialBearing,
        antialias: true,
        interactive: true,
      });

      mapRef.current = map;

      map.on("load", () => {
        if (!map) return;

        configureMapTheme(map);

        const runHighlight = () => applyBuildingHighlight(map!, lng, lat);

        if (!isPreview) {
          map.flyTo({
            center: [lng, lat],
            zoom: flyZoom,
            pitch: flyPitch,
            bearing: flyBearing,
            duration: 3000,
            essential: true,
            curve: 1.4,
            easing: (t) => t * (2 - t),
          });
          map.once("moveend", () => {
            if (map) map.once("idle", runHighlight);
          });
        } else {
          map.once("idle", runHighlight);
        }

        const el = createMarkerElement(draggable);
        marker = new mapboxgl.Marker({ element: el, anchor: "center", draggable })
          .setLngLat([lng, lat])
          .addTo(map);
        markerRef.current = marker;

        if (draggable) {
          marker.on("dragend", () => {
            const pos = marker?.getLngLat();
            if (!pos) return;
            const next = { lat: pos.lat, lng: pos.lng };
            coordsRef.current = next;
            setCoords(next);
            onCoordsChange?.(pos.lat, pos.lng);
            if (map) applyBuildingHighlight(map, pos.lng, pos.lat);
          });
        }

        if (!isPreview) {
          popup = new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false,
            offset: 25,
            className: "vacayza-popup",
          }).setHTML(`
            <div style="
              background: #000a04;
              border: 1px solid #00ff41;
              padding: 12px 16px;
              font-family: 'DM Mono', monospace;
              color: #00ff41;
              font-size: 11px;
              letter-spacing: 0.08em;
              box-shadow: 0 0 12px rgba(0, 255, 65, 0.25);
            ">
              <div style="color: #66ff99; margin-bottom: 4px; font-size: 10px;
                          text-transform: uppercase; letter-spacing: 0.15em;">
                FOR SALE
              </div>
              <div style="font-size: 13px; margin-bottom: 4px; color: #fff;">${escapeHtml(propertyTitle)}</div>
              <div style="color: #00ff41;">
                R ${price.toLocaleString("en-ZA")}
              </div>
            </div>
          `);

          el.addEventListener("mouseenter", () => {
            popup?.setLngLat([lng, lat]).addTo(map!);
          });
          el.addEventListener("mouseleave", () => popup?.remove());
        }

        if (!isPreview) {
          map.addControl(
            new mapboxgl.NavigationControl({
              showCompass: true,
              visualizePitch: true,
            }),
            "top-right",
          );

          class ResetViewControl implements mapboxgl.IControl {
            onAdd(m: mapboxgl.Map) {
              const btn = document.createElement("button");
              btn.className = "mapboxgl-ctrl-icon";
              btn.style.cssText = `
                background: #000a04;
                border: 1px solid #00ff41;
                color: #00ff41;
                font-family: 'DM Mono', monospace;
                font-size: 10px;
                padding: 6px 10px;
                cursor: pointer;
                letter-spacing: 0.1em;
              `;
              btn.textContent = "RESET VIEW";
              btn.onclick = () => {
                const c = coordsRef.current;
                if (!c) return;
                m.flyTo({
                  center: [c.lng, c.lat],
                  zoom: flyZoom,
                  pitch: flyPitch,
                  bearing: flyBearing,
                  duration: 1500,
                });
              };
              const container = document.createElement("div");
              container.className = "mapboxgl-ctrl mapboxgl-ctrl-group";
              container.appendChild(btn);
              return container;
            }
            onRemove() {}
          }

          map.addControl(new ResetViewControl(), "top-left");
        }
      });
    });

    return () => {
      cancelled = true;
      stopBuildingColorPulse();
      if (map && selectedBuildingRef.current) {
        clearBuildingHighlight(map, selectedBuildingRef.current);
        selectedBuildingRef.current = null;
      }
      mapInitializedRef.current = false;
      markerRef.current = null;
      mapRef.current = null;
      marker?.remove();
      popup?.remove();
      map?.remove();
    };
  }, [coords, draggable, isPreview, onCoordsChange, price, propertyTitle]);

  useEffect(() => {
    if (!markerRef.current || !coords || !mapRef.current) return;
    markerRef.current.setLngLat([coords.lng, coords.lat]);
    const map = mapRef.current;
    if (selectedBuildingRef.current) {
      clearBuildingHighlight(map, selectedBuildingRef.current);
      selectedBuildingRef.current = null;
    }
    highlightBuildingWhenReady(map, coords.lng, coords.lat, (feature) => {
      selectedBuildingRef.current = feature;
    });
  }, [coords]);

  const tokenMissing = !process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  return (
    <div className={`vacayza-map-matrix relative w-full border border-[#0a3320] ${heightClass}`}>
      <div ref={mapContainer} className="absolute inset-0 h-full w-full" />

      {autoGeocode && (geocoding || !coords) && !tokenMissing && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#0a0a0a]/80">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#00ff41]">
            {geocodeError ? "Could not locate address" : "Locating on map..."}
          </p>
        </div>
      )}

      {tokenMissing && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#0a0a0a]">
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-vacayza-muted">
            Map unavailable — set NEXT_PUBLIC_MAPBOX_TOKEN
          </p>
        </div>
      )}

      {!isPreview && coords && (
        <div
          className="pointer-events-none absolute bottom-6 left-6 z-10 max-w-[calc(100%-3rem)] border border-[#00ff41]/40 bg-[rgba(0,10,4,0.9)] p-3 backdrop-blur-md md:p-4"
          style={{ fontFamily: "var(--font-dm-mono), monospace", boxShadow: "0 0 16px rgba(0,255,65,0.12)" }}
        >
          <div className="mb-1 text-[10px] uppercase tracking-[0.15em] text-[#00ff41]/60">Location</div>
          <div className="text-xs text-[#66ff99]">{address}</div>
          <div className="mt-1 text-[10px] tracking-[0.1em] text-[#00ff41]">
            {suburbDisplay} · CAPE TOWN
          </div>
        </div>
      )}
    </div>
  );
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
