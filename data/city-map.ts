// What the Explore map needs for each city: its real boundary (from
// OpenStreetMap, simplified), plus distance helpers.

import boundaries from "./city-boundaries.json";

export type LatLng = { lat: number; lng: number };

// Each city is one or more outlines, as [lat, lng] pairs.
export const cityBoundaries = boundaries as unknown as Record<string, [number, number][][]>;


export const INDIA_VIEW = { center: { lat: 22.5, lng: 80 }, zoom: 4.6 };

export function distanceKm(a: LatLng, b: LatLng) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

export function formatKm(km: number) {
  return km < 10 ? `${km.toFixed(1)} km` : `${Math.round(km)} km`;
}

// "Basavanagudi" → "basavanagudi", for ?near= links to a city's listings.
export function localitySlug(locality: string) {
  return locality.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
