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

  // Highlight the city and glide to it. Going between cities, the old
  // city's glow fades, the map glides across, and the new boundary and its
  // pins appear once it lands.
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    const layer = cityLayerRef.current;
    const container = containerRef.current;
    if (!ready || !L || !map || !layer || !container) return;

    const rings = cityBoundaries[city.id];
    const target = rings
      ? L.polygon(rings).getBounds()
      : L.latLng(city.coords.lat, city.coords.lng).toBounds(24000);
    const padding: [number, number] = [20, 20];
    const reduced = prefersReducedMotion();
    const first = firstFlyRef.current;
    firstFlyRef.current = false;

    const drawCity = (fade: boolean) => {
      layer.clearLayers();
      if (!rings) return;
      const world: [number, number][] = [
        [85, -180],
        [85, 180],
        [-85, 180],
        [-85, -180],
      ];
      const fadeClass = fade ? " city-map-fade-in" : "";
      L.polygon([world, ...rings], {
        stroke: false,
        fillColor: "#120b07",
        fillOpacity: 0.62,
        interactive: false,
        className: `city-map-mask${fadeClass}`,
      }).addTo(layer);
      L.polygon(rings, {
        color: "#e3b26b",
        weight: 2,
        fillColor: "#c8643b",
        fillOpacity: 0.08,
        interactive: false,
        className: `city-map-outline${fadeClass}`,
      }).addTo(layer);
    };

    if (reduced) {
      drawCity(false);
      map.fitBounds(target, { padding });
      return;
    }

    let timer = 0;
    const land = () => {
      drawCity(true);
      container.removeAttribute("data-flying");
    };
    const glide = (duration: number) => {
      map.once("moveend", land);
      map.flyToBounds(target, { padding, duration, easeLinearity: 0.2 });
    };

    container.setAttribute("data-flying", "");
    if (first) {
      // Open on India for a beat, then swoop into the city.
      timer = window.setTimeout(() => glide(2), 500);
    } else {
      // Let the old city's glow fade first.
      layer.eachLayer((shape) =>
        (shape as Leaflet.Path).getElement()?.classList.add("city-map-fade-out"),
      );
      timer = window.setTimeout(() => {
        layer.clearLayers();
        const distance = map.getCenter().distanceTo(target.getCenter()) / 1000;
        // Longer trips take a little longer, but never drag.
        glide(Math.min(3, 1.6 + distance / 1500));
      }, 280);
    }
    return () => {
      window.clearTimeout(timer);
      map.off("moveend", land);
    };
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

    hosts.forEach((host, index) => {
      const circle = L.circle([host.area.lat, host.area.lng], {
        className: "city-map-area",
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
          html: `<span class="city-map-host" style="--i:${index}"><span class="city-map-host-dot">${BOWL_ICON}</span><span class="city-map-host-label">${escapeHtml(host.locality)}</span></span>`,
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
    });

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
