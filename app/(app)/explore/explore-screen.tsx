"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { useOpenCity } from "@/app/_components/city-transition";
import { NotificationBell } from "@/app/_components/notification-bell";
import { MehmanLogo } from "@/app/_components/mehman-logo";
import { SiteHeader } from "@/app/_components/site-header";
import {
  distanceKm,
  formatKm,
  localitySlug,
  type LatLng,
} from "@/data/city-map";
import {
  defaultExploreCity,
  exploreCities,
  exploreCityHref,
  findExploreCity,
  nearestCity,
  type ExploreCity,
} from "@/data/experiences";
import { approvedTablesInCity, useDemoReady, useDemoState } from "@/lib/demo/store";
import { CityMap, type MapHost, type MapVisitor } from "./city-map";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ivory";

const LOCATE = "__locate";

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
  // The visitor's real position, once the browser shares it.
  const [realSpot, setRealSpot] = useState<LatLng | null>(null);
  // The neighbourhood the visitor last pointed at or tapped.
  const [pickedHostId, setPickedHostId] = useState<string | null>(null);
  const userPickedCity = useRef(false);
  const thumbRefs = useRef(new Map<string, HTMLElement>());
  const state = useDemoState();
  const ready = useDemoReady();

  // "You" appears on the map only in the city you're actually in.
  const visitor = useMemo<MapVisitor | null>(
    () =>
      realSpot && distanceKm(realSpot, city.coords) <= 60
        ? { ...realSpot, label: "You" }
        : null,
    [realSpot, city],
  );

  // Family tables with a neighbourhood on the map, nearest first.
  const nearby = useMemo(() => {
    const rows = approvedTablesInCity(state, city.id).flatMap((table) => {
      const host = state.hosts.find((h) => h.id === table.hostId);
      if (!host?.area || !host.locality) return [];
      const km = realSpot ? distanceKm(realSpot, host.area) : null;
      return [{ table, host, km }];
    });
    return rows.sort((a, b) => (a.km ?? 0) - (b.km ?? 0));
  }, [state, city, realSpot]);

  const mapHosts = useMemo<MapHost[]>(
    () =>
      nearby.map(({ table, host, km }) => ({
        id: table.id,
        locality: host.locality!,
        area: host.area!,
        name: host.displayName,
        km,
      })),
    [nearby],
  );

  const selectedId = nearby.some((row) => row.table.id === pickedHostId)
    ? pickedHostId
    : (nearby[0]?.table.id ?? null);
  const awayKm = realSpot && !visitor ? distanceKm(realSpot, city.coords) : null;

  // Next keeps this page mounted while a city is open; start fresh on return.
  useEffect(
    () => () => {
      setNotice(null);
      setLocating(false);
      setPickedHostId(null);
    },
    [],
  );

  function open(next: ExploreCity) {
    openCity(next, thumbRefs.current.get(next.id));
  }

  // Ask for the visitor's location as the page opens. If they're near a
  // Mehman city, start there; a refusal just leaves distances off.
  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const spot = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setRealSpot(spot);
        const nearest = nearestCity(spot.lat, spot.lng);
        if (nearest && !userPickedCity.current) setCity(nearest);
      },
      () => {},
      { timeout: 10000, maximumAge: 600000 },
    );
  }, []);

  function openNeighbourhood(tableId: string, pin: HTMLElement | null) {
    const row = nearby.find((r) => r.table.id === tableId);
    if (!row?.host.locality) return;
    openCity(city, pin, `near=${localitySlug(row.host.locality)}`);
  }

  // Phones: the first tap shows the distance, the second opens the city.
  // Desktop: hovering shows the distance, so a click opens straight away.
  function tapNeighbourhood(tableId: string, pin: HTMLElement | null) {
    const touch = window.matchMedia("(pointer: coarse)").matches;
    if (touch && tableId !== pickedHostId) {
      setPickedHostId(tableId);
      return;
    }
    openNeighbourhood(tableId, pin);
  }

  function locateMe() {
    if (!("geolocation" in navigator)) {
      setNotice("Location isn’t available in this browser. Pick a city instead.");
      return;
    }
    userPickedCity.current = false;
    setLocating(true);
    setNotice(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        const spot = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setRealSpot(spot);
        const nearest = nearestCity(spot.lat, spot.lng);
        if (nearest) {
          setCity(nearest);
          setNotice(`Showing tables near you in ${nearest.name}.`);
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
    if (next) selectCity(next);
  }

  function selectCity(next: ExploreCity) {
    userPickedCity.current = true;
    setCity(next);
    setNotice(null);
    setPickedHostId(null);
  }

  // Picking a city lower down the page brings the map back into view.
  function selectCityAndShow(next: ExploreCity) {
    selectCity(next);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  }

  return (
    <div className="explore-page">
      {/* Wider screens share the website header; phones keep the logo,
          city pill and bell laid over the artwork. */}
      <div className="hidden md:block">
        <SiteHeader current="explore" />
      </div>
      <header className="explore-header">
        <Link
          href="/"
          aria-label="Mehman home"
          className={`explore-logo rounded ${focusRing}`}
        >
          <MehmanLogo className="h-full w-auto" />
        </Link>

        <div className="explore-header-end">
          <div className="explore-city-pill relative has-[select:focus-visible]:outline-2 has-[select:focus-visible]:outline-offset-4 has-[select:focus-visible]:outline-ivory">
            <PinIcon className="size-4 shrink-0" />
            <span>{city.name}</span>
            <ChevronIcon className="size-4 shrink-0 opacity-80" />
            <CitySelect city={city} label="Dining city" onChange={changeCity} />
          </div>
          <NotificationBell />
        </div>
      </header>

      <main className="explore-scene">
        <h1 className="sr-only">Explore India&rsquo;s food traditions</h1>
        <div className="explore-map">
          <CityMap
            city={city}
            cities={exploreCities}
            hosts={mapHosts}
            visitor={visitor}
            selectedId={selectedId}
            showTip={pickedHostId !== null}
            onHoverHost={setPickedHostId}
            onTapHost={tapNeighbourhood}
            onSelectCity={(id) => {
              const next = findExploreCity(id);
              if (next) selectCity(next);
            }}
          />
        </div>
        <p className="explore-map-credit">
          Map ©{" "}
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">
            OpenStreetMap
          </a>{" "}
          contributors
        </p>

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

        <section aria-labelledby="near-heading" className="explore-near">
          <div className="explore-near-head">
            <h2 id="near-heading">Family tables in {city.name}</h2>
            <p>
              {awayKm !== null
                ? `You’re about ${formatKm(awayKm)} away from ${city.name}.`
                : realSpot
                  ? "Distances are from where you are now."
                  : "Share your location to see how far each table is."}{" "}
              {!realSpot && (
                <button type="button" onClick={locateMe} className="explore-near-locate">
                  {locating ? "Finding you…" : "Use my location"}
                </button>
              )}
            </p>
          </div>
          {ready && nearby.length === 0 ? (
            <p className="explore-near-empty">
              No family tables in {city.name} yet.{" "}
              <Link href="/become-a-host">Cook for guests here?</Link>
            </p>
          ) : (
            <ul>
              {nearby.map(({ table, host, km }) => {
                const selected = table.id === selectedId;
                return (
                  <li key={table.id} data-selected={selected ? "" : undefined}>
                    <button
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setPickedHostId(table.id)}
                      className={`explore-near-pick ${focusRing}`}
                    >
                      <span className="explore-near-locality">
                        <PinIcon className="size-3.5 shrink-0" />
                        {host.locality}
                        {km !== null && awayKm === null && (
                          <span className="explore-near-km">· {formatKm(km)}</span>
                        )}
                      </span>
                      <span className="explore-near-title">{table.title}</span>
                      <span className="explore-near-host">
                        {host.displayName} · ₹{table.pricePerGuest.toLocaleString("en-IN")} a guest
                      </span>
                    </button>
                    <Link href={`/tables/${table.id}`} className={`explore-near-view ${focusRing}`}>
                      View table
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

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
                      selectCityAndShow(option);
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
