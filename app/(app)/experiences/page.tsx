"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { defaultExploreCity, findExploreCity } from "@/data/experiences";
import { lastCity } from "@/lib/demo/store";

// The Experiences tab opens the city the visitor chose last on Explore.
export default function ExperiencesPage() {
  const router = useRouter();
  useEffect(() => {
    const city = findExploreCity(lastCity()) ?? defaultExploreCity;
    router.replace(`/explore/${city.id}`);
  }, [router]);
  return <p className="min-h-dvh bg-pine py-24 text-center text-sm text-ivory/50">Loading experiences…</p>;
}
