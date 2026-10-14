"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import {
  defaultCity,
  defaultRegion,
  findCity,
  findRegion,
} from "@/data/discovery";

type SelectionKey = "city" | "region";

const storageKeys: Record<SelectionKey, string> = {
  city: "mehman:city",
  region: "mehman:region",
};

function readStored(key: SelectionKey) {
  try {
    return window.localStorage.getItem(storageKeys[key]);
  } catch {
    return null;
  }
}

export function storeSelection(key: SelectionKey, id: string) {
  try {
    window.localStorage.setItem(storageKeys[key], id);
  } catch {
    // Storage is only a convenience for returning visitors.
  }
}

/**
 * City and region selection, held in the URL so it survives refreshes and
 * can be shared. When a key is missing or invalid in the URL, the last
 * stored value (or the default) is written back into the URL. `ready` is
 * false until the URL holds a valid value for every requested key, so
 * callers can avoid flashing the wrong selection.
 */
export function useSelection(keys: SelectionKey[]) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const urlCity = findCity(searchParams.get("city"));
  const urlRegion = findRegion(searchParams.get("region"));
  const missingCity = keys.includes("city") && !urlCity;
  const missingRegion = keys.includes("region") && !urlRegion;
  const ready = !missingCity && !missingRegion;

  useEffect(() => {
    if (ready) {
      if (urlCity) storeSelection("city", urlCity.id);
      if (urlRegion) storeSelection("region", urlRegion.id);
      return;
    }
    const next = new URLSearchParams(searchParams);
    if (missingCity) {
      next.set("city", (findCity(readStored("city")) ?? defaultCity).id);
    }
    if (missingRegion) {
      next.set(
        "region",
        (findRegion(readStored("region")) ?? defaultRegion).id,
      );
    }
    router.replace(`${pathname}?${next}`, { scroll: false });
  }, [
    ready,
    missingCity,
    missingRegion,
    urlCity,
    urlRegion,
    searchParams,
    router,
    pathname,
  ]);

  function select(key: SelectionKey, id: string) {
    const next = new URLSearchParams(searchParams);
    next.set(key, id);
    router.replace(`${pathname}?${next}`, { scroll: false });
  }

  return {
    ready,
    city: urlCity ?? defaultCity,
    region: urlRegion ?? defaultRegion,
    setCity: (id: string) => select("city", id),
    setRegion: (id: string) => select("region", id),
  };
}
