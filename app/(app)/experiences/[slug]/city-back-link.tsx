"use client";

import { useSearchParams } from "next/navigation";
import { BackLink } from "@/app/_components/site-header";
import { exploreCityHref, findExploreCity } from "@/data/experiences";

export function CityBackLink() {
  const city = findExploreCity(useSearchParams().get("city"));
  if (!city) return <BackLink href="/explore">Back to Explore</BackLink>;
  return <BackLink href={exploreCityHref(city)}>Back to {city.name}</BackLink>;
}
