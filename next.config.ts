import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
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
