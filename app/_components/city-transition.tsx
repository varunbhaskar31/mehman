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
  origin: Origin;
  startedAt: number;
  phase: "opening" | "lifting";
};

const OpenCityContext = createContext<
  (city: ExploreCity, from?: HTMLElement | null) => void
>(() => {});

export function useOpenCity() {
  return useContext(OpenCityContext);
}

// Lives in the (app) layout so the curtain stays on screen while the route
// changes beneath it.
export function CityTransitionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [opening, setOpening] = useState<Opening | null>(null);

  const openCity = useCallback(
    (city: ExploreCity, from?: HTMLElement | null) => {
      const href = exploreCityHref(city);
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
      setOpening({ city, origin, startedAt: performance.now(), phase: "opening" });
    },
    [router],
  );

  const target = opening ? exploreCityHref(opening.city) : null;

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
  const arrived = target !== null && pathname === target;
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
      {children}
      {opening && <CityCurtain opening={opening} />}
    </OpenCityContext.Provider>
  );
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
