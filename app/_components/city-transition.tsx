"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  Suspense,
  type CSSProperties,
  type ReactNode,
} from "react";
import { exploreCityHref, type ExploreCity } from "@/data/experiences";

// When the curtain has filled the screen, the city page starts loading
// underneath; the curtain lifts once both the page and the greeting are ready.
const NAVIGATE_AT = 900;
const MIN_SHOWN = 4300;
const GIVE_UP_AFTER = 8000;
const LIFT_DURATION = 800;

type Origin = { x: number; y: number; radius: number };

type Opening = {
  city: ExploreCity;
  // Where to land, e.g. the city filtered to one neighbourhood.
  href: string;
  origin: Origin;
  startedAt: number;
  phase: "opening" | "lifting";
};

type OpenCity = (
  city: ExploreCity,
  from?: HTMLElement | null,
  query?: string,
) => void;

const OpenCityContext = createContext<OpenCity>(() => {});

export function useOpenCity() {
  return useContext(OpenCityContext);
}

// Lives in the (app) layout so the curtain stays on screen while the route
// changes beneath it.
export function CityTransitionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [pathname, setPathname] = useState<string | null>(null);
  const [opening, setOpening] = useState<Opening | null>(null);

  const openCity = useCallback(
    (city: ExploreCity, from?: HTMLElement | null, query?: string) => {
      const href = exploreCityHref(city) + (query ? `?${query}` : "");
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      if (reduceMotion) {
        router.push(href);
        return;
      }
      router.prefetch(href);
      const rect = from?.getBoundingClientRect();
      const origin = rect
        ? {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
            radius: rect.width / 2,
          }
        : { x: window.innerWidth / 2, y: window.innerHeight / 2, radius: 0 };
      setOpening({ city, href, origin, startedAt: performance.now(), phase: "opening" });
    },
    [router],
  );

  const target = opening ? opening.href : null;

  useEffect(() => {
    if (!opening || opening.phase !== "opening" || !target) return;
    const timer = setTimeout(
      () => router.push(target),
      Math.max(0, NAVIGATE_AT - (performance.now() - opening.startedAt)),
    );
    return () => clearTimeout(timer);
  }, [opening, target, router]);

  // Lift the curtain once the city page is in place and the greeting has
  // had time to play; give up waiting if navigation stalls.
  const arrived = opening !== null && pathname === exploreCityHref(opening.city);
  useEffect(() => {
    if (!opening || opening.phase !== "opening") return;
    const elapsed = performance.now() - opening.startedAt;
    const wait = arrived
      ? Math.max(0, MIN_SHOWN - elapsed)
      : Math.max(0, GIVE_UP_AFTER - elapsed);
    const timer = setTimeout(
      () => setOpening((current) => current && { ...current, phase: "lifting" }),
      wait,
    );
    return () => clearTimeout(timer);
  }, [opening, arrived]);

  useEffect(() => {
    if (opening?.phase !== "lifting") return;
    const timer = setTimeout(() => setOpening(null), LIFT_DURATION);
    return () => clearTimeout(timer);
  }, [opening?.phase]);

  return (
    <OpenCityContext.Provider value={openCity}>
      <Suspense>
        <PathnameReporter onChange={setPathname} />
      </Suspense>
      {children}
      {opening && <CityCurtain opening={opening} />}
    </OpenCityContext.Provider>
  );
}

// Reads the route inside its own Suspense boundary, so the layout itself
// doesn't depend on the URL and pages can still render instantly.
function PathnameReporter({ onChange }: { onChange: (path: string) => void }) {
  const pathname = usePathname();
  useEffect(() => onChange(pathname), [pathname, onChange]);
  return null;
}

function CityCurtain({ opening }: { opening: Opening }) {
  const { city, origin, phase } = opening;
  const ref = useRef<HTMLDivElement>(null);

  // Start as the tapped thumbnail, then grow on the next frame.
  useEffect(() => {
    const frame = requestAnimationFrame(() =>
      ref.current?.setAttribute("data-open", ""),
    );
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div
      ref={ref}
      role="status"
      aria-label={`Opening ${city.name}`}
      data-lifting={phase === "lifting" ? "" : undefined}
      className="city-curtain"
      style={
        {
          "--origin-x": `${origin.x}px`,
          "--origin-y": `${origin.y}px`,
          "--origin-r": `${origin.radius}px`,
        } as CSSProperties
      }
    >
      <Image
        src={city.thumbnail}
        alt=""
        fill
        sizes="96px"
        className="city-curtain-wash"
      />
      <div className="city-curtain-content">
        <Image
          src={city.thumbnail}
          alt=""
          sizes="112px"
          className="city-curtain-thumb"
        />
        <p className="city-curtain-name">{city.name}</p>
        <p className="city-curtain-greeting">{city.greeting.local}</p>
        <p className="city-curtain-translation">{city.greeting.english}</p>
        <p className="city-curtain-setting">
          Setting the table
          <span aria-hidden="true" className="city-curtain-dots">
            <span>.</span>
            <span>.</span>
            <span>.</span>
          </span>
        </p>
      </div>
    </div>
  );
}
