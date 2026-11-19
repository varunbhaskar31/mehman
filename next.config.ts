import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // Hosts' photos live in Supabase Storage.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
    ],
  },
  partialPrefetching: true,
  // The service worker must always be checked for updates, and may control
  // the whole site.
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
  // Cities used to be chosen with /explore?city=…; they now have their own
  // page. Keep this list in step with exploreCities in data/experiences.ts.
  async redirects() {
    return [
      {
        source: "/explore",
        has: [
          {
            type: "query",
            key: "city",
            value: "(?<city>bengaluru|kochi|lucknow|jaipur|kolkata|hyderabad)",
          },
        ],
        destination: "/explore/:city",
        permanent: false,
      },
      // Renamed pages.
      { source: "/account", destination: "/profile", permanent: false },
      { source: "/notifications", destination: "/updates", permanent: false },
      { source: "/inbox", destination: "/updates", permanent: false },
      { source: "/trips", destination: "/bookings", permanent: false },
      // The illustrative concept pages were replaced by real family tables.
      { source: "/experiences/:slug", destination: "/explore", permanent: false },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
