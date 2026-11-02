"use client";

import "leaflet/dist/leaflet.css";
import type * as Leaflet from "leaflet";
import { useEffect, useRef, useState } from "react";
import { cityBoundaries, formatKm, INDIA_VIEW, type LatLng } from "@/data/city-map";
import type { ExploreCity } from "@/data/experiences";

export type MapHost = {
  id: string;
  locality: string;
  area: LatLng;
  name: string;
  // From the visitor's real location; null until they share it.
  km: number | null;
};

export type MapVisitor = LatLng & { label: string };

type Props = {
  city: ExploreCity;
  cities: ExploreCity[];
  hosts: MapHost[];
  visitor: MapVisitor | null;
  selectedId: string | null;
  // True once the visitor has pointed at or tapped a pin themselves.
  showTip: boolean;
  onHoverHost: (id: string) => void;
  onTapHost: (id: string, pin: HTMLElement | null) => void;
  onSelectCity: (id: string) => void;
};

// Roughly how far a host's pin may be from their door, so the map shows a
// neighbourhood and never the exact house.
const AREA_RADIUS_M = 700;

const BOWL_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 11h18a9 9 0 0 1-18 0Z"/><path d="M8 7c0-1 1-1.5 1-2.5M12 7c0-1 1-1.5 1-2.5M16 7c0-1 1-1.5 1-2.5"/></svg>';

function escapeHtml(text: string) {
  return text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

function isTouch() {
  return window.matchMedia("(pointer: coarse)").matches;
}

function tipHtml(host: MapHost, touch: boolean) {
  const distance =
    host.km === null
      ? "Share your location to see how far"
      : `${formatKm(host.km)} from you`;
  const hint = touch ? "Tap again to see tables" : "Click to see tables";
  return `<strong>${escapeHtml(host.locality)}</strong><span>${distance}</span><em>${hint}</em>`;
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// A real map of the chosen city: everything outside its boundary is dimmed,
// host neighbourhoods are pinned, and "you" is marked with the distance to
// the selected host.
export function CityMap({
  city,
  cities,
  hosts,
  visitor,
  selectedId,
  showTip,
  onHoverHost,
  onTapHost,
  onSelectCity,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Leaflet.Map | null>(null);
  const leafletRef = useRef<typeof Leaflet | null>(null);
  const cityLayerRef = useRef<Leaflet.LayerGroup | null>(null);
  const pinLayerRef = useRef<Leaflet.LayerGroup | null>(null);
  const lineLayerRef = useRef<Leaflet.LayerGroup | null>(null);
  const pinsRef = useRef(new Map<string, { marker: Leaflet.Marker; circle: Leaflet.Circle }>());
  const firstFlyRef = useRef(true);
  const [ready, setReady] = useState(false);

  // Callbacks change every render; markers read the latest through refs.
  const onHoverHostRef = useRef(onHoverHost);
  const onTapHostRef = useRef(onTapHost);
  const onSelectCityRef = useRef(onSelectCity);
  useEffect(() => {
    onHoverHostRef.current = onHoverHost;
    onTapHostRef.current = onTapHost;
    onSelectCityRef.current = onSelectCity;
  });

  // Create the map once. Leaflet touches window, so it loads in the browser.
  useEffect(() => {
    let cancelled = false;
    let map: Leaflet.Map | null = null;
    import("leaflet").then(({ default: L }) => {
      if (cancelled || !containerRef.current) return;
      leafletRef.current = L;
      const touch = window.matchMedia("(pointer: coarse)").matches;
      map = L.map(containerRef.current, {
        center: [INDIA_VIEW.center.lat, INDIA_VIEW.center.lng],
        zoom: INDIA_VIEW.zoom,
        zoomSnap: 0.1,
        zoomControl: false,
        attributionControl: false,
        scrollWheelZoom: false,
        // On phones a one-finger drag scrolls the page; pinch still zooms.
        dragging: !touch,
      });
      L.control.zoom({ position: "topright" }).addTo(map);
      // Standard OpenStreetMap tiles; CSS turns them dark and warm.
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
      }).addTo(map);

      // Every Mehman city as a dot, visible while zoomed out over India.
      const dots = L.layerGroup().addTo(map);
      for (const c of cities) {
        L.circleMarker([c.coords.lat, c.coords.lng], {
          radius: 5,
          className: "city-map-dot",
        })
          .bindTooltip(c.name, { direction: "top", className: "city-map-tip" })
          .on("click", () => onSelectCityRef.current(c.id))
          .addTo(dots);
      }
      const toggleDots = () => {
        if (!map) return;
        containerRef.current?.toggleAttribute("data-zoomed-in", map.getZoom() >= 8.5);
      };
      map.on("zoomend", toggleDots);

      cityLayerRef.current = L.layerGroup().addTo(map);
      lineLayerRef.current = L.layerGroup().addTo(map);
      pinLayerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
      setReady(true);
    });
    return () => {
      cancelled = true;
      map?.remove();
      mapRef.current = null;
      firstFlyRef.current = true;
    };
  }, [cities]);

  // Highlight the city and fly to it.
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    const layer = cityLayerRef.current;
    if (!ready || !L || !map || !layer) return;
    layer.clearLayers();
    const rings = cityBoundaries[city.id];
    if (!rings) {
      map.flyTo([city.coords.lat, city.coords.lng], 11);
      return;
    }

    const world: [number, number][] = [
      [85, -180],
      [85, 180],
      [-85, 180],
      [-85, -180],
    ];
    L.polygon([world, ...rings], {
      stroke: false,
      fillColor: "#120b07",
      fillOpacity: 0.62,
      interactive: false,
      className: "city-map-mask",
    }).addTo(layer);
    const outline = L.polygon(rings, {
      color: "#e3b26b",
      weight: 2,
      fillColor: "#c8643b",
      fillOpacity: 0.08,
      interactive: false,
      className: "city-map-outline",
    }).addTo(layer);

    const bounds = outline.getBounds();
    const padding: [number, number] = [20, 20];
    if (prefersReducedMotion()) {
      map.fitBounds(bounds, { padding });
    } else if (firstFlyRef.current) {
      // Open on India for a beat, then swoop into the city.
      const timer = window.setTimeout(
        () => map.flyToBounds(bounds, { padding, duration: 2 }),
        500,
      );
      firstFlyRef.current = false;
      return () => window.clearTimeout(timer);
    } else {
      map.flyToBounds(bounds, { padding, duration: 1.6 });
    }
    firstFlyRef.current = false;
  }, [ready, city]);

  // Host neighbourhoods and the visitor. Pins are only rebuilt when the
  // hosts change, so hovering one doesn't swap it out under the pointer.
  useEffect(() => {
    const L = leafletRef.current;
    const layer = pinLayerRef.current;
    if (!ready || !L || !layer) return;
    layer.clearLayers();
    pinsRef.current.clear();
    const touch = isTouch();

    for (const host of hosts) {
      const circle = L.circle([host.area.lat, host.area.lng], {
        radius: AREA_RADIUS_M,
        color: "#e3b26b",
        weight: 1,
        opacity: 0.4,
        fillColor: "#e3b26b",
        fillOpacity: 0.08,
        interactive: false,
      }).addTo(layer);
      const marker = L.marker([host.area.lat, host.area.lng], {
        title: `${host.name}, ${host.locality}`,
        alt: `${host.name}, ${host.locality}`,
        riseOnHover: true,
        icon: L.divIcon({
          className: "city-map-host-icon",
          iconSize: [40, 40],
          iconAnchor: [20, 20],
          html: `<span class="city-map-host"><span class="city-map-host-dot">${BOWL_ICON}</span><span class="city-map-host-label">${escapeHtml(host.locality)}</span></span>`,
        }),
      })
        .bindTooltip(tipHtml(host, touch), {
          direction: "top",
          offset: [0, -22],
          className: "city-map-host-tip",
        })
        .on("mouseover", () => {
          if (!isTouch()) onHoverHostRef.current(host.id);
        })
        .on("click", (event) =>
          onTapHostRef.current(
            host.id,
            (event.target as Leaflet.Marker).getElement() ?? null,
          ),
        )
        .addTo(layer);
      pinsRef.current.set(host.id, { marker, circle });
    }

    if (!visitor) return;
    L.marker([visitor.lat, visitor.lng], {
      title: visitor.label,
      alt: visitor.label,
      keyboard: false,
      zIndexOffset: 1000,
      icon: L.divIcon({
        className: "city-map-you-icon",
        iconSize: [20, 20],
        iconAnchor: [10, 10],
        html: `<span class="city-map-you"><span class="city-map-you-label">${escapeHtml(visitor.label)}</span></span>`,
      }),
    }).addTo(layer);
  }, [ready, hosts, visitor]);

  // Mark the selected neighbourhood and draw the way there from "you".
  useEffect(() => {
    const L = leafletRef.current;
    const lines = lineLayerRef.current;
    if (!ready || !L || !lines) return;
    lines.clearLayers();
    for (const [id, { marker, circle }] of pinsRef.current) {
      const selected = id === selectedId;
      marker.setZIndexOffset(selected ? 500 : 0);
      marker
        .getElement()
        ?.querySelector(".city-map-host")
        ?.toggleAttribute("data-selected", selected);
      circle.setStyle({
        opacity: selected ? 0.9 : 0.4,
        fillOpacity: selected ? 0.18 : 0.08,
      });
      // Phones have no hover, so the first tap shows the distance.
      if (selected && showTip && isTouch()) marker.openTooltip();
      else if (isTouch()) marker.closeTooltip();
    }

    const selected = hosts.find((h) => h.id === selectedId);
    if (!visitor || !selected) return;
    L.polyline(
      [
        [visitor.lat, visitor.lng],
        [selected.area.lat, selected.area.lng],
      ],
      {
        color: "#f6efdf",
        weight: 1.5,
        opacity: 0.85,
        dashArray: "4 7",
        interactive: false,
      },
    ).addTo(lines);
  }, [ready, hosts, visitor, selectedId, showTip]);

  return (
    <div
      ref={containerRef}
      role="region"
      aria-label={`Map of ${city.name} with family tables`}
      className="city-map"
    />
  );
}
