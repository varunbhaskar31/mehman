"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { MehmanLogo } from "@/app/_components/mehman-logo";
import courtyard from "@/assets/welcome-desktop.jpg";

const ENTER_DURATION_MS = 700;

// Lamp flames in the 1672×941 painting, as % of its width and height.
const lamps = [
  { x: 22.6, y: 3.4, size: 9 },
  { x: 28.1, y: 9.6, size: 6 },
  { x: 57.1, y: 19.9, size: 6 },
  { x: 85.6, y: 17.7, size: 6 },
  { x: 91.8, y: 34.7, size: 5 },
  { x: 2.1, y: 84.5, size: 8 },
];

/**
 * The welcome on wide screens: the greeting and "Step inside" beside a
 * family courtyard feast. Phones keep the kitchen painting (see page.tsx).
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
    <div className="welcome-desk">
      {/* The same painting, blurred, fills the screen with its lamplight. */}
      <Image src={courtyard} alt="" fill sizes="20vw" quality={40} className="welcome-desk-glow" />
      <div className="welcome-desk-art">
        <Image
          src={courtyard}
          alt="A family feast in a lantern-lit courtyard: a woman in a cream sari serves guests at a long wooden table laden with dishes, grandparents laugh, children run and play, and a dog naps on the rug."
          fill
          sizes="66vw"
          className="object-cover"
        />
        {lamps.map((lamp) => (
          <span
            key={`${lamp.x}-${lamp.y}`}
            aria-hidden="true"
            className="welcome-desk-lamp"
            style={{ left: `${lamp.x}%`, top: `${lamp.y}%`, width: `${lamp.size}%` }}
          />
        ))}
      </div>

      <div className="welcome-desk-copy">
        <p className="flex items-center gap-3 font-serif text-3xl leading-none">
          <MehmanLogo className="h-12 w-auto" />
          Mehman
        </p>
        <p className="mt-3 text-xs tracking-[0.35em] text-ivory/75 uppercase">People · Food · Cultures</p>
        <h1 className="mt-8 font-[family-name:var(--font-hand)] text-[clamp(2.5rem,3.6vw,3.75rem)] leading-[1.05] text-[#f3c98b]">
          Aao, khana tayyar hai!
        </h1>
        <p className="mt-2 font-serif text-2xl text-ivory">Come, food&rsquo;s ready.</p>
        <p className="mt-4 max-w-md text-[17px] leading-relaxed text-ivory/80">
          Pull up a chair at a family&rsquo;s table, from Kochi to Kolkata. Home-cooked meals, shared by the people who make them.
        </p>
        <div className="mt-8 flex items-center gap-6">
          <Link
            href="/explore"
            onClick={stepInside}
            className="inline-flex h-14 items-center gap-4 rounded-full bg-ivory px-8 font-[family-name:var(--font-cta)] text-lg font-medium text-pine shadow-[0_10px_30px_rgb(0_0_0/0.35)] transition hover:bg-white focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ivory active:scale-[0.98]"
          >
            Step inside
            <span aria-hidden="true">→</span>
          </Link>
          <Link
            href="/how-it-works"
            className="rounded text-[15px] text-ivory/85 underline decoration-ivory/40 underline-offset-[6px] hover:text-ivory hover:decoration-ivory focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ivory"
          >
            How Mehman works
          </Link>
        </div>
      </div>

      <div aria-hidden="true" className="welcome-desk-veil" data-active={entering ? "" : undefined} />
    </div>
  );
}
