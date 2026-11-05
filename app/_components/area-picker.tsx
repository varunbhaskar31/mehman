"use client";

import "leaflet/dist/leaflet.css";
import type * as Leaflet from "leaflet";
import { useEffect, useId, useRef, useState } from "react";
import type { LatLng } from "@/data/city-map";
import type { ExploreCity } from "@/data/experiences";
import { currentPosition, findLocality, isNearCity } from "@/lib/geo";

type Props = {
  city: ExploreCity;
  locality: string;
  area: LatLng | null;
  onChange: (area: LatLng | null) => void;
  error?: string;
};

// Where a host's pin goes on Explore: their current location, or the
// neighbourhood they typed. A small map shows the area guests will see.
export function AreaPicker({ city, locality, area, onChange, error }: Props) {
  const id = useId();
  const [useHere, setUseHere] = useState(false);
  // Problems with "use my current location".
  const [hereStatus, setHereStatus] = useState<{ busy?: boolean; message: string; key: string } | null>(null);
  // The last neighbourhood looked up, and whether it was found.
  const [lookup, setLookup] = useState<{ key: string; found: boolean } | null>(null);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  const name = locality.trim();
  const key = `${name.toLowerCase()}|${city.id}`;

  // Typed neighbourhood: look it up once the host pauses typing.
  useEffect(() => {
    if (useHere) return;
    if (name.length < 3) {
      onChangeRef.current(null);
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      const spot = await findLocality(name, city.name);
      if (cancelled) return;
      const found = Boolean(spot && isNearCity(spot, city.coords));
      onChangeRef.current(found ? spot : null);
      setLookup({ key, found });
    }, 700);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [useHere, name, key, city]);

  // A location problem stays until the host edits the neighbourhood.
  let status: { busy?: boolean; message: string } | null = useHere || hereStatus?.key === key ? hereStatus : null;
  if (!useHere && !status && name.length >= 3) {
    if (lookup?.key !== key) status = { busy: true, message: `Finding ${name} on the map…` };
    else if (!lookup.found) status = { message: `We couldn't find ${name} in ${city.name}. Check the spelling, or use your current location.` };
  }

  async function toggleHere(on: boolean) {
    setUseHere(on);
    setHereStatus(null);
    if (!on) return;
    onChange(null);
    setHereStatus({ busy: true, message: "Getting your location…", key });
    try {
      const spot = await currentPosition();
      if (!isNearCity(spot, city.coords)) {
        setUseHere(false);
        setHereStatus({ message: `You seem to be outside ${city.name} right now. Type your neighbourhood instead.`, key });
        return;
      }
      onChange(spot);
      setHereStatus(null);
    } catch (problem) {
      setUseHere(false);
      setHereStatus({ message: (problem as Error).message, key });
    }
  }

  return (
    <div>
      <label htmlFor={`${id}-here`} className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-ivory/85">
        <input
          id={`${id}-here`}
          type="checkbox"
          checked={useHere}
          onChange={(event) => void toggleHere(event.target.checked)}
          className="size-5 accent-[#e8c08f]"
        />
        Use my current location (I&rsquo;m at home now)
      </label>
      <div className="mt-2 overflow-hidden rounded-2xl border border-ivory/15">
        <AreaMap city={city} area={area} />
      </div>
      <p aria-live="polite" className={`mt-2 text-sm ${(status ? !status.busy : error) ? "text-terracotta-soft" : "text-ivory/55"}`}>
        {status?.message ??
          error ??
          (area
            ? "Guests see a pin somewhere in this circle, a few hundred metres from your home. Never your house."
            : "Type your neighbourhood above, or tick the box, to place your table on the map.")}
      </p>
    </div>
  );
}

function AreaMap({ city, area }: { city: ExploreCity; area: LatLng | null }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Leaflet.Map | null>(null);
  const layerRef = useRef<Leaflet.LayerGroup | null>(null);
  const leafletRef = useRef<typeof Leaflet | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let map: Leaflet.Map | null = null;
    import("leaflet").then(({ default: L }) => {
      if (cancelled || !containerRef.current) return;
      leafletRef.current = L;
      map = L.map(containerRef.current, {
        zoomControl: false,
        attributionControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        touchZoom: false,
        boxZoom: false,
        keyboard: false,
      });
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 18 }).addTo(map);
      layerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
      setReady(true);
    });
    return () => {
      cancelled = true;
      map?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!ready || !L || !map || !layer) return;
    layer.clearLayers();
    if (!area) {
      map.setView([city.coords.lat, city.coords.lng], 10);
      return;
    }
    const circle = L.circle([area.lat, area.lng], {
      radius: 700,
      color: "#e3b26b",
      weight: 1.5,
      fillColor: "#e3b26b",
      fillOpacity: 0.15,
      interactive: false,
    }).addTo(layer);
    map.flyToBounds(circle.getBounds(), { padding: [24, 24], duration: 0.8 });
  }, [ready, area, city]);

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label={area ? "Map showing the area guests will see" : `Map of ${city.name}`}
      className="city-map h-44"
    />
  );
}
