"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import courtyard from "@/assets/welcome-desktop.jpg";

const ENTER_DURATION_MS = 700;

// Lamp flames in the 1672×941 painting, as % of its width and height.
const lamps = [
  { x: 50.78, y: 9.35, size: 9 },
  { x: 59.33, y: 31.46, size: 4.5 },
  { x: 69.56, y: 30.6, size: 4.5 },
  { x: 88.1, y: 29.76, size: 4.5 },
  { x: 96.59, y: 38.15, size: 4 },
  { x: 8.67, y: 79.4, size: 6 },
];

function Leaves({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 40" aria-hidden="true" className={className}>
      <g fill="#c4532c">
        <path d="M30 38C22 28 23 12 30 2c7 10 8 26 0 36Z" />
        <path d="M27 38C16 36 6 26 4 12c11 3 20 13 23 26Z" />
        <path d="M33 38c11-2 21-12 23-26-11 3-20 13-23 26Z" />
      </g>
    </svg>
  );
}

/**
 * Laptops and desktops: the courtyard feast fills the window, with the
 * words and buttons laid out as in the design. The painting may crop at
 * the edges; the words are anchored to the window, so they never do.
 * Phones keep the kitchen painting (see page.tsx).
 */
export function WelcomeDesktop() {
  const router = useRouter();
  const [entering, setEntering] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
      // Next keeps this page mounted while hidden; start fresh on return.
      setEntering(false);
    },
    [],
  );

  function stepInside(event: MouseEvent<HTMLAnchorElement>) {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    event.preventDefault();
    if (entering) return;
    setEntering(true);
    timer.current = window.setTimeout(() => router.push("/explore"), ENTER_DURATION_MS);
  }

  return (
    <div className="welcome-hero">
      <div className="welcome-hero-art">
        <Image
          src={courtyard}
          alt="A family feast in a lantern-lit courtyard: a woman in a cream sari serves guests at a long wooden table laden with dishes, grandparents laugh, children run and play, and a dog naps on the rug."
          fill
          preload
          sizes="(min-width: 1672px) 100vw, 1672px"
          className="object-cover"
        />
        {lamps.map((lamp) => (
          <span
            key={`${lamp.x}-${lamp.y}`}
            aria-hidden="true"
            className="welcome-hero-lamp"
            style={{ left: `${lamp.x}%`, top: `${lamp.y}%`, width: `${lamp.size}%` }}
          />
        ))}
      </div>

      <Link href="/" className="welcome-hero-logo" aria-label="Mehman home">
        <Leaves className="welcome-hero-leaves" />
        <span className="welcome-hero-wordmark">Mehman</span>
        <span className="welcome-hero-tagline">People · Food · Cultures</span>
      </Link>

      <nav aria-label="Main" className="welcome-hero-nav">
        <Link href="/explore">Explore</Link>
        <Link href="/become-a-host">Become a Host</Link>
      </nav>

      <div className="welcome-hero-copy">
        <h1 className="welcome-hero-title">
          Come hungry.
          <br />
          Leave with stories.
        </h1>
        <p className="welcome-hero-lede">
          Authentic home dining experiences
          <br />
          across India, right where you are.
        </p>
        <Link href="/explore" onClick={stepInside} className="welcome-hero-cta">
          Step inside
          <span aria-hidden="true">→</span>
        </Link>
      </div>
      <div aria-hidden="true" className="welcome-hero-veil" data-active={entering ? "" : undefined} />
    </div>
  );
}
