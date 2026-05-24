"use client";

import { useEffect, useRef, useState } from "react";
import {
  isLikelyStreetAddress,
  mapboxLocationUrl,
  mapGeocodeQuery,
  sanitizeMapAddress,
} from "../../lib/street-address";
import PropertyMap3D from "../PropertyMap3D";

const inputClass =
  "w-full border border-[#333] bg-black p-3 font-mono text-xs uppercase tracking-[0.1em] text-vacayza-off-white outline-none focus:ring-1 focus:ring-vacayza-amber";

async function geocodeClient(address: string): Promise<{ lat: number; lng: number } | null> {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token) return null;

  const query = encodeURIComponent(mapGeocodeQuery(address));
  const res = await fetch(
    `https://api.mapbox.com/search/geocode/v6/forward?q=${query}&country=ZA&proximity=18.4241,-33.9249&access_token=${token}`,
  );
  if (!res.ok) return null;

  const json = (await res.json()) as {
    features?: Array<{ geometry?: { coordinates?: [number, number] } }>;
  };
  const featureCoords = json.features?.[0]?.geometry?.coordinates;
  if (!featureCoords) return null;

  const [lng, lat] = featureCoords;
  return { lat, lng };
}

export interface MapCoords {
  lat: number;
  lng: number;
}

interface AdminMapLocationProps {
  address: string;
  onAddressChange: (address: string) => void;
  propertyId: string | null;
  propertyTitle: string;
  price: number;
  coords: MapCoords | null;
  onCoordsChange: (coords: MapCoords | null) => void;
  onCoordsPersisted?: (address: string) => void;
  publishEnabled?: boolean;
  /** Coordinates already stored for this listing (kept when scrape has no street address). */
  initialCoords?: MapCoords | null;
  /** Changes when a different listing is loaded — resets the street address field. */
  propertySyncKey?: string;
}

export default function AdminMapLocation({
  address,
  onAddressChange,
  propertyId,
  propertyTitle,
  price,
  coords,
  onCoordsChange,
  onCoordsPersisted,
  publishEnabled = false,
  initialCoords = null,
  propertySyncKey = "new",
}: AdminMapLocationProps) {
  const [streetAddress, setStreetAddress] = useState("");
  const [scrapedTitleWarning, setScrapedTitleWarning] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");
  const [adjustLocation, setAdjustLocation] = useState(false);
  const lastLocatedAddress = useRef<string | null>(null);

  useEffect(() => {
    const sanitized = sanitizeMapAddress(address, propertyTitle);
    setStreetAddress(sanitized);
    setScrapedTitleWarning(Boolean(address.trim()) && !sanitized);
    setError("");
    setAdjustLocation(false);
    lastLocatedAddress.current = sanitized || null;
    if (initialCoords) {
      onCoordsChange(initialCoords);
    } else if (!sanitized) {
      onCoordsChange(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when switching listings
  }, [propertySyncKey]);

  useEffect(() => {
    const trimmed = streetAddress.trim();
    if (lastLocatedAddress.current && trimmed !== lastLocatedAddress.current) {
      onCoordsChange(null);
      setError("");
    }
  }, [streetAddress, onCoordsChange]);

  useEffect(() => {
    if (coords && streetAddress.trim()) {
      lastLocatedAddress.current = streetAddress.trim();
    }
  }, [coords, streetAddress]);

  const handleStreetChange = (value: string) => {
    setStreetAddress(value);
    onAddressChange(value);
    setScrapedTitleWarning(false);
  };

  const handleLocate = async () => {
    const trimmed = streetAddress.trim();
    if (!trimmed) {
      setError("Enter a street address first (e.g. 16 Bree Street, Cape Town City Centre).");
      return;
    }
    if (!isLikelyStreetAddress(trimmed)) {
      setError(
        "That looks like a listing headline, not a street address. Use the building number and street name.",
      );
      return;
    }

    setLocating(true);
    setError("");
    onAddressChange(trimmed);

    try {
      if (propertyId) {
        const res = await fetch("/api/geocode-property", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address: trimmed, propertyId, force: true }),
        });
        const json = await res.json();
        if (!json.success) {
          setError(json.error || "Could not find that address on the map.");
          onCoordsChange(null);
          return;
        }
        onCoordsChange({ lat: json.latitude, lng: json.longitude });
        onCoordsPersisted?.(trimmed);
      } else {
        const result = await geocodeClient(trimmed);
        if (!result) {
          setError("Could not find that address. Try a more specific street address.");
          onCoordsChange(null);
          return;
        }
        onCoordsChange(result);
        onCoordsPersisted?.(trimmed);
      }
      lastLocatedAddress.current = trimmed;
    } catch {
      setError("Geocoding failed. Check your Mapbox token and try again.");
    } finally {
      setLocating(false);
    }
  };

  const handleCoordsAdjust = async (lat: number, lng: number) => {
    onCoordsChange({ lat, lng });
    if (!propertyId) return;

    try {
      await fetch("/api/update-property-coords", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId, latitude: lat, longitude: lng }),
      });
      lastLocatedAddress.current = streetAddress.trim();
      onCoordsPersisted?.(streetAddress.trim());
    } catch {
      setError("Could not save adjusted pin position.");
    }
  };

  const tokenMissing = !process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  return (
    <div className="border border-[#333] p-4">
      <p className="mb-1 text-[11px] uppercase tracking-[0.2em] text-vacayza-amber">Map address</p>
      <p className="mb-4 text-[10px] leading-5 text-vacayza-muted">
        Type the building&apos;s street number and name (not the Property24 headline). Cape Town and suburb are added
        when locating.
      </p>

      {scrapedTitleWarning && (
        <p className="mb-4 border border-[#333] bg-[#111] p-3 text-[10px] leading-5 text-vacayza-muted">
          The scrape did not include a street address — only the listing title was found. Enter the real address below
          (e.g. <span className="text-vacayza-off-white">16 Bree Street</span> or{" "}
          <span className="text-vacayza-off-white">32 Kloof Street, Gardens</span>).
        </p>
      )}

      <label className="block">
        <span className="mb-2 block text-[10px] uppercase tracking-[0.15em] text-vacayza-muted">
          Street address
        </span>
        <input
          type="text"
          value={streetAddress}
          onChange={(e) => handleStreetChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void handleLocate();
            }
          }}
          placeholder="e.g. 16 Bree Street, Cape Town City Centre"
          className={inputClass}
          autoComplete="street-address"
        />
      </label>

      {(coords || streetAddress.trim()) && !tokenMissing && (
        <a
          href={mapboxLocationUrl(streetAddress, coords)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block text-[10px] uppercase tracking-[0.15em] text-vacayza-amber underline-offset-2 hover:underline"
        >
          {coords ? "Open pin in Mapbox" : "Preview address in Mapbox"}
        </a>
      )}

      <button
        type="button"
        onClick={handleLocate}
        disabled={locating || !streetAddress.trim() || tokenMissing}
        className="mt-4 w-full border border-vacayza-amber px-4 py-3 text-[11px] uppercase tracking-[0.2em] text-vacayza-amber disabled:opacity-50"
      >
        {locating ? "Locating on map..." : "Locate on map"}
      </button>

      {!propertyId && (
        <p className="mt-2 text-[10px] leading-5 text-vacayza-muted">
          Save the listing once to store map coordinates in the database. You can preview the pin before saving.
        </p>
      )}

      {tokenMissing && (
        <p className="mt-2 text-[10px] text-red-400">Set NEXT_PUBLIC_MAPBOX_TOKEN in .env.local to enable maps.</p>
      )}

      {error && <p className="mt-3 text-xs leading-6 text-red-400">{error}</p>}

      {coords && (
        <div className="mt-6">
          <PropertyMap3D
            key={propertyId ?? `preview-${coords.lat}-${coords.lng}`}
            address={streetAddress.trim()}
            latitude={coords.lat}
            longitude={coords.lng}
            propertyTitle={propertyTitle}
            price={price}
            variant="preview"
            autoGeocode={false}
            draggable={adjustLocation}
            onCoordsChange={handleCoordsAdjust}
          />
          <button
            type="button"
            onClick={() => setAdjustLocation((v) => !v)}
            className="mt-3 border border-[#333] px-3 py-2 text-[10px] uppercase tracking-[0.15em] text-vacayza-amber hover:border-vacayza-amber"
          >
            {adjustLocation ? "Done adjusting" : "Adjust pin on map"}
          </button>
          {adjustLocation && (
            <p className="mt-2 text-[10px] leading-5 text-vacayza-muted">
              Drag the amber pin to the correct building, then click Done adjusting.
            </p>
          )}
        </div>
      )}

      {!coords && !locating && streetAddress.trim() && !error && isLikelyStreetAddress(streetAddress) && (
        <p className="mt-4 text-[10px] leading-5 text-vacayza-muted">
          Click &quot;Locate on map&quot; to place the pin on the listing page.
        </p>
      )}

      {publishEnabled && !coords && (
        <p className="mt-4 border border-vacayza-amber/40 bg-vacayza-amber/5 p-3 text-[10px] leading-5 text-vacayza-amber">
          Publish is on but this listing has no map pin yet. Enter a street address and click Locate on map.
        </p>
      )}
    </div>
  );
}
