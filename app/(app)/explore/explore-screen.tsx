"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  defaultExploreCity,
  exploreCities,
  experienceHref,
  experiencesFor,
  exploreCityHref,
  findExploreCity,
  nearestCity,
  searchCities,
  type ExploreCity,
} from "@/data/experiences";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ivory";

export function ExploreScreen() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const city = findExploreCity(searchParams.get("city")) ?? defaultExploreCity;

  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const matches = searchCities(query);

  // On phones, a compact city bar pins to the top once the full city row
  // has scrolled out of view.
  const cityRowRef = useRef<HTMLElement>(null);
  const experiencesRef = useRef<HTMLElement>(null);
  const [showCompactBar, setShowCompactBar] = useState(false);

  useEffect(() => {
    const row = cityRowRef.current;
    if (!row) return;
    // The negative top margin counts the row as gone once it is behind
    // where the compact bar sits.
    const observer = new IntersectionObserver(
      ([entry]) =>
        setShowCompactBar(
          !entry.isIntersecting && entry.boundingClientRect.top < 0,
        ),
      { rootMargin: "-96px 0px 0px 0px" },
    );
    observer.observe(row);
    return () => observer.disconnect();
  }, []);

  function selectCity(next: ExploreCity) {
    setQuery("");
    setNotice(null);
    router.replace(exploreCityHref(next), { scroll: false });
  }

  function selectFromCompactBar(next: ExploreCity) {
    selectCity(next);
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    experiencesRef.current?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
  }

  function locateMe() {
    const keep = `${city.name} stays selected.`;
    if (!("geolocation" in navigator)) {
      setNotice(`Location isn’t available in this browser. ${keep}`);
      return;
    }
    setLocating(true);
    setNotice(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        const nearest = nearestCity(
          position.coords.latitude,
          position.coords.longitude,
        );
        if (nearest) {
          selectCity(nearest);
          setNotice(`Showing ${nearest.name}, the nearest Mehman city.`);
        } else {
          setNotice(`Mehman hasn’t reached your area yet. ${keep}`);
        }
      },
      (error) => {
        setLocating(false);
        setNotice(
          error.code === error.PERMISSION_DENIED
            ? `Location access wasn’t allowed. ${keep}`
            : `We couldn’t find your location. ${keep}`,
        );
      },
      { timeout: 10000, maximumAge: 600000 },
    );
  }

  const cityExperiences = experiencesFor(city);

  return (
    <>
      <div
        aria-hidden={!showCompactBar}
        inert={!showCompactBar}
        className={`fixed inset-x-0 top-0 z-30 border-b border-ivory/10 bg-pine pt-[env(safe-area-inset-top)] transition-[opacity,translate] duration-200 motion-reduce:transition-none md:hidden ${
          showCompactBar ? "" : "-translate-y-full opacity-0"
        }`}
      >
        <ul
          aria-label="Dining city"
          className="no-scrollbar flex snap-x snap-proximity scroll-px-4 gap-2 overflow-x-auto overscroll-x-contain px-4 py-2.5"
        >
          {exploreCities.map((option) => {
            const isSelected = option.id === city.id;
            return (
              <li key={option.id} className="shrink-0 snap-start">
                <button
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => selectFromCompactBar(option)}
                  className={`flex h-11 items-center gap-2 rounded-full border py-1 pr-4 pl-1 font-serif text-sm transition-transform active:scale-95 motion-reduce:active:scale-100 ${focusRing} ${
                    isSelected
                      ? "border-ivory text-ivory"
                      : "border-ivory/20 text-ivory/70"
                  }`}
                >
                  <Image
                    src={option.thumbnail}
                    alt=""
                    sizes="36px"
                    className="size-9 rounded-full object-cover"
                  />
                  {option.name}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <section ref={cityRowRef} aria-label="Choose a city" className="mt-2">
        <div className="no-scrollbar snap-x snap-proximity scroll-px-4 overflow-x-auto overscroll-x-contain">
          {matches.length > 0 ? (
            <ul className="mx-auto flex w-max gap-3 px-4 py-2 md:gap-6">
              {matches.map((option) => {
                const isSelected = option.id === city.id;
                return (
                  <li key={option.id} className="snap-start">
                    <button
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => selectCity(option)}
                      onFocus={(event) =>
                        event.currentTarget.scrollIntoView({
                          block: "nearest",
                          inline: "nearest",
                        })
                      }
                      className={`group flex w-[5.25rem] flex-col items-center gap-2 rounded-xl transition-transform active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100 md:w-24 ${focusRing}`}
                    >
                      <span
                        className={`rounded-full p-[3px] ring-2 transition-shadow motion-reduce:transition-none ${
                          isSelected
                            ? "ring-ivory"
                            : "ring-transparent group-hover:ring-ivory/35"
                        }`}
                      >
                        <Image
                          src={option.thumbnail}
                          alt=""
                          sizes="80px"
                          className="size-16 rounded-full object-cover md:size-20"
                        />
                      </span>
                      <span
                        className={`font-serif text-base md:text-lg ${
                          isSelected
                            ? "text-ivory"
                            : "text-ivory/65 group-hover:text-ivory"
                        }`}
                      >
                        {option.name}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="flex min-h-[7.5rem] items-center justify-center px-4 text-center text-base text-ivory/75 md:min-h-[8.5rem]">
              Mehman hasn&rsquo;t reached this city yet.
            </p>
          )}
        </div>

        <div className="mx-auto mt-4 flex max-w-md flex-wrap items-center justify-center gap-x-5 gap-y-3 px-4">
          <input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setNotice(null);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && query.trim() && matches[0]) {
                selectCity(matches[0]);
              }
            }}
            placeholder="Search cities"
            aria-label="Search cities"
            autoComplete="off"
            className="h-11 w-full max-w-60 rounded-full border border-ivory/30 bg-transparent px-5 text-base text-ivory placeholder:text-ivory/45 focus-visible:border-ivory/70 focus-visible:outline-none"
          />
          <button
            type="button"
            onClick={locateMe}
            disabled={locating}
            className={`min-h-11 rounded text-sm text-ivory/70 underline decoration-ivory/30 underline-offset-4 hover:text-ivory disabled:no-underline ${focusRing}`}
          >
            {locating ? "Finding you…" : "Use my location"}
          </button>
        </div>
        <p
          aria-live="polite"
          className="mx-auto mt-2 min-h-5 max-w-md px-4 text-center text-sm text-ivory/60"
        >
          {notice}
        </p>
      </section>

      <section
        ref={experiencesRef}
        aria-labelledby="experiences-title"
        className="mx-auto max-w-4xl scroll-mt-[calc(4.5rem+env(safe-area-inset-top))] px-4 pt-8 pb-[max(4rem,env(safe-area-inset-bottom))] md:px-10 md:pt-12 md:pb-24"
      >
        <h2 id="experiences-title" className="font-serif text-3xl md:text-4xl">
          Food experiences in {city.name}
        </h2>
        <p className="mt-2 text-sm text-ivory/55">
          Illustrative concepts while we meet host families. Nothing here can be
          booked yet.
        </p>

        <ul className="mt-8 space-y-10 md:mt-10 md:space-y-12">
          {cityExperiences.map((experience) => (
            <li key={experience.id}>
              <Link
                href={experienceHref(experience, city)}
                className={`group grid gap-4 rounded-2xl transition-opacity active:opacity-80 motion-reduce:transition-none md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] md:items-center md:gap-10 ${focusRing}`}
              >
                <div>
                  <div className="relative -mx-4 aspect-[3/2] overflow-hidden bg-ivory/5 md:mx-0 md:rounded-2xl">
                    <Image
                      src={experience.image}
                      alt={experience.imageAlt}
                      fill
                      sizes="(min-width: 896px) 440px, (min-width: 768px) 50vw, 100vw"
                      className="object-cover"
                    />
                  </div>
                  <p className="mt-1.5 text-[11px] text-ivory/40">
                    Photo: {experience.credit.author},{" "}
                    {experience.credit.license}, via Wikimedia Commons
                  </p>
                </div>
                <div>
                  <p className="text-xs tracking-[0.2em] text-terracotta-soft uppercase">
                    Experience concept
                  </p>
                  <h3 className="mt-2 font-serif text-2xl decoration-terracotta-soft decoration-1 underline-offset-4 group-hover:underline md:text-3xl">
                    {experience.name}
                  </h3>
                  <p className="mt-2 text-base leading-relaxed text-ivory/75">
                    {experience.description}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
