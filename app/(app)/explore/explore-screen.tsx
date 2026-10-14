"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useOpenCity } from "@/app/_components/city-transition";
import { MehmanLogo } from "@/app/_components/mehman-logo";
import exploreScene from "@/assets/explore-scene.jpg";
import {
  defaultExploreCity,
  exploreCities,
  exploreCityHref,
  findExploreCity,
  nearestCity,
  type ExploreCity,
} from "@/data/experiences";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ivory";

const LOCATE = "__locate";

const navLinks = [
  { href: "/explore", label: "Explore", current: true },
  { href: "/how-it-works", label: "How it works" },
  { href: "/our-story", label: "Our story" },
  { href: "/become-a-host", label: "Become a host" },
];

function PinIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        fill="currentColor"
        d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7Zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Z"
      />
    </svg>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

// A native select laid over the pill, so phones get their own picker.
function CitySelect({
  city,
  label,
  onChange,
}: {
  city: ExploreCity;
  label: string;
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
}) {
  return (
    <select
      aria-label={label}
      value={city.id}
      onChange={onChange}
      className="peer absolute inset-0 cursor-pointer appearance-none rounded-full opacity-0"
    >
      {exploreCities.map((option) => (
        <option key={option.id} value={option.id}>
          {option.name}
        </option>
      ))}
      <option value={LOCATE}>Use my location</option>
    </select>
  );
}

export function ExploreScreen() {
  const openCity = useOpenCity();
  const [city, setCity] = useState(defaultExploreCity);
  const [notice, setNotice] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const thumbRefs = useRef(new Map<string, HTMLElement>());

  // Next keeps this page mounted while a city is open; start fresh on return.
  useEffect(
    () => () => {
      setNotice(null);
      setLocating(false);
    },
    [],
  );

  function open(next: ExploreCity) {
    openCity(next, thumbRefs.current.get(next.id));
  }

  function locateMe() {
    if (!("geolocation" in navigator)) {
      setNotice("Location isn’t available in this browser. Pick a city instead.");
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
          setCity(nearest);
          setNotice(`${nearest.name} is the nearest Mehman city.`);
        } else {
          setNotice("Mehman hasn’t reached your area yet. Pick a city instead.");
        }
      },
      (error) => {
        setLocating(false);
        setNotice(
          error.code === error.PERMISSION_DENIED
            ? "Location access wasn’t allowed. Pick a city instead."
            : "We couldn’t find your location. Pick a city instead.",
        );
      },
      { timeout: 10000, maximumAge: 600000 },
    );
  }

  function changeCity(event: ChangeEvent<HTMLSelectElement>) {
    if (event.target.value === LOCATE) {
      locateMe();
      return;
    }
    const next = findExploreCity(event.target.value);
    if (next) {
      setCity(next);
      setNotice(null);
    }
  }

  return (
    <div className="explore-page">
      <header className="explore-header">
        <Link
          href="/"
          aria-label="Mehman home"
          className={`explore-logo rounded ${focusRing}`}
        >
          <MehmanLogo className="h-full w-auto" />
        </Link>

        <nav aria-label="Main" className="explore-nav">
          <ul>
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={link.current ? "page" : undefined}
                  className={`rounded text-ivory/90 hover:text-ivory ${focusRing}`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="explore-city-pill relative has-[select:focus-visible]:outline-2 has-[select:focus-visible]:outline-offset-4 has-[select:focus-visible]:outline-ivory">
          <PinIcon className="size-4 shrink-0" />
          <span>{city.name}</span>
          <ChevronIcon className="size-4 shrink-0 opacity-80" />
          <CitySelect city={city} label="Dining city" onChange={changeCity} />
        </div>
      </header>

      <main className="explore-scene">
        <h1 className="sr-only">Explore India&rsquo;s food traditions</h1>
        <Image
          src={exploreScene}
          alt="An India-shaped brass platter filled with regional dishes, from rice and curries to dosa, idli and momos, on a dark green table with brass vessels, chillies and leaves."
          preload
          sizes="(min-width: 768px) 1024px, 120vw"
          className="explore-art"
        />

        <div className="explore-search">
          <div className="relative flex min-w-0 flex-1 items-center gap-3 rounded-full has-[select:focus-visible]:outline-2 has-[select:focus-visible]:outline-offset-2 has-[select:focus-visible]:outline-pine">
            <PinIcon className="explore-search-pin shrink-0" />
            <span className="min-w-0 flex-1 truncate">
              {locating ? "Finding you…" : city.name}
            </span>
            <ChevronIcon className="size-5 shrink-0 text-[#8a8378]" />
            <CitySelect
              city={city}
              label="Choose a city to dine in"
              onChange={changeCity}
            />
          </div>
          <span aria-hidden="true" className="explore-search-divider" />
          <button
            type="button"
            onClick={() => open(city)}
            aria-label={`Explore food experiences in ${city.name}`}
            className="explore-search-go focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="size-[45%]"
            >
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
        </div>
        <p aria-live="polite" className="explore-notice">
          {notice}
        </p>

        <section aria-label="Cities" className="explore-cities">
          <ul>
            {exploreCities.map((option) => {
              const isSelected = option.id === city.id;
              return (
                <li key={option.id}>
                  <Link
                    href={exploreCityHref(option)}
                    onClick={(event) => {
                      // Let modified clicks open a new tab as usual.
                      if (event.metaKey || event.ctrlKey || event.shiftKey) {
                        return;
                      }
                      event.preventDefault();
                      setCity(option);
                      open(option);
                    }}
                    data-selected={isSelected ? "" : undefined}
                    className={`explore-city group ${focusRing}`}
                  >
                    <Image
                      ref={(node) => {
                        if (node) thumbRefs.current.set(option.id, node);
                        else thumbRefs.current.delete(option.id);
                      }}
                      src={option.thumbnail}
                      alt=""
                      sizes="100px"
                      className="explore-city-thumb"
                    />
                    <span className="explore-city-name">{option.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      </main>
    </div>
  );
}
