"use client";

import { useEffect } from "react";
import type { CulturalRegion } from "@/data/discovery";
import { storeSelection, useSelection } from "@/lib/use-selection";
import { CultureView } from "./culture-view";

export function CultureScreen({ region }: { region: CulturalRegion }) {
  const { ready, city } = useSelection(["city"]);

  useEffect(() => {
    storeSelection("region", region.id);
  }, [region.id]);

  return <CultureView region={region} city={ready ? city : undefined} />;
}
