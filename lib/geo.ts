import { distanceKm, type LatLng } from "@/data/city-map";

// Finds a neighbourhood on the map with OpenStreetMap's free search. Only
// the neighbourhood and city are sent, never the home address.
export async function findLocality(locality: string, cityName: string): Promise<LatLng | null> {
  const query = new URLSearchParams({
    q: `${locality}, ${cityName}`,
    format: "jsonv2",
    countrycodes: "in",
    limit: "1",
  });
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?${query}`, {
      headers: { "Accept-Language": "en" },
    });
    if (!response.ok) return null;
    const [hit] = (await response.json()) as { lat: string; lon: string }[];
    return hit ? { lat: Number(hit.lat), lng: Number(hit.lon) } : null;
  } catch {
    return null;
  }
}

export function currentPosition(): Promise<LatLng> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("Location isn't available in this browser. Type your neighbourhood instead."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({ lat: position.coords.latitude, lng: position.coords.longitude }),
      (error) =>
        reject(
          new Error(
            error.code === error.PERMISSION_DENIED
              ? "Location is blocked for this site. Allow it in your browser, or type your neighbourhood instead."
              : "We couldn't get your location. Try again, or type your neighbourhood instead.",
          ),
        ),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  });
}

// Hosts must be in the city they host in; the database checks this too.
export const MAX_KM_FROM_CITY = 60;

export function isNearCity(spot: LatLng, city: LatLng) {
  return distanceKm(spot, city) <= MAX_KM_FROM_CITY;
}
