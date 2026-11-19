import type { MetadataRoute } from "next";

// Makes Mehman installable: name, colours and icons for the home screen.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Mehman · Eat at a family's table",
    short_name: "Mehman",
    description: "Home-cooked meals at family tables in Bengaluru and Hyderabad.",
    start_url: "/explore?source=pwa",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#1a110b",
    theme_color: "#1a110b",
    categories: ["food", "travel", "lifestyle"],
    lang: "en-IN",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "My bookings", url: "/bookings", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Hosting", url: "/host", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
