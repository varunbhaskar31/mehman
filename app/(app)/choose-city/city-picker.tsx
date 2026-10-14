"use client";

import Link from "next/link";
import { primaryButtonClass } from "@/app/_components/fields";
import { diningCities, exploreHref } from "@/data/discovery";
import { useSelection } from "@/lib/use-selection";

export function CityPicker() {
  const { ready, city, setCity } = useSelection(["city"]);

  return (
    <div aria-busy={!ready} className={`md:pt-10 ${ready ? "" : "invisible"}`}>
      <fieldset>
        <legend className="sr-only">Dining city</legend>
        <ul className="border-t border-ivory/15">
          {diningCities.map((option) => (
            <li key={option.id}>
              <label className="group flex min-h-16 cursor-pointer items-center gap-4 border-b border-ivory/15 py-3 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ivory">
                <input
                  type="radio"
                  name="city"
                  value={option.id}
                  checked={option.id === city.id}
                  onChange={() => setCity(option.id)}
                  className="peer sr-only"
                />
                <span
                  aria-hidden="true"
                  className="grid size-5 shrink-0 place-items-center rounded-full border border-ivory/40 peer-checked:border-terracotta-soft"
                >
                  <span
                    className={`size-2.5 rounded-full ${option.id === city.id ? "bg-terracotta-soft" : ""}`}
                  />
                </span>
                <span
                  className={`flex-1 font-serif text-2xl md:text-3xl ${option.id === city.id ? "text-ivory" : "text-ivory/70 group-hover:text-ivory"}`}
                >
                  {option.name}
                </span>
                <span
                  className={`text-xs tracking-[0.15em] uppercase ${option.isLaunchCity ? "text-terracotta-soft" : "text-ivory/45"}`}
                >
                  {option.isLaunchCity ? "Launching first" : "Coming later"}
                </span>
              </label>
            </li>
          ))}
        </ul>
      </fieldset>

      <Link
        href={exploreHref(city)}
        className={`${primaryButtonClass} mt-8 w-full md:w-auto`}
      >
        Continue
        <span aria-hidden="true">→</span>
      </Link>
    </div>
  );
}
