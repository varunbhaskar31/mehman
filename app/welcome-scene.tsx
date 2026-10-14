"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import sari from "@/assets/welcome/sari.png";
import sariBackdrop from "@/assets/welcome/sari-backdrop.png";
import shutter from "@/assets/welcome/shutter.png";
import shutterBackdrop from "@/assets/welcome/shutter-backdrop.png";
import windowView from "@/assets/welcome/window-view.png";

const ENTER_DURATION_MS = 700;

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Living details layered over the welcome artwork: the host's greeting, a
 * breeze through the window (foliage, shutter and the hanging sari), steam
 * over the pot, the lantern's glow, and the "Step inside" button that walks
 * the guest into Explore. Moving parts are cut from the artwork itself, with
 * the wall painted in behind them, so they match the illustration exactly.
 */
export function WelcomeScene() {
  const router = useRouter();
  const [entering, setEntering] = useState(false);
  const timers = useRef<number[]>([]);

  function later(fn: () => void, ms: number) {
    timers.current.push(window.setTimeout(fn, ms));
  }

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach(window.clearTimeout);
      pending.length = 0;
      // Next keeps this page mounted while hidden; start fresh on return.
      setEntering(false);
    };
  }, []);

  function stepInside(event: MouseEvent<HTMLAnchorElement>) {
    // Let new-tab and new-window clicks behave like a normal link.
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      prefersReducedMotion()
    ) {
      return;
    }
    event.preventDefault();
    if (entering) return;
    setEntering(true);
    later(() => router.push("/explore"), ENTER_DURATION_MS);
  }

  return (
    <>
      <svg className="welcome-filters" aria-hidden="true" focusable="false">
        <filter id="welcome-breeze">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.035 0.06"
            numOctaves="2"
            seed="4"
          >
            <animate
              attributeName="baseFrequency"
              dur="9s"
              values="0.035 0.06;0.042 0.07;0.035 0.06"
              repeatCount="indefinite"
            />
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" scale="3" />
        </filter>
      </svg>

      <div className="welcome-window-view" aria-hidden="true">
        <Image src={windowView} alt="" fill sizes="60px" />
      </div>

      <div className="welcome-shutter" aria-hidden="true">
        <Image src={shutterBackdrop} alt="" fill sizes="80px" />
        <div className="welcome-shutter-panel">
          <Image src={shutter} alt="" fill sizes="80px" />
        </div>
      </div>

      <div className="welcome-sari" aria-hidden="true">
        <Image src={sariBackdrop} alt="" fill sizes="120px" />
        <div className="welcome-sari-cloth">
          <Image src={sari} alt="" fill sizes="120px" />
        </div>
      </div>

      <p className="welcome-greeting">
        <span className="welcome-greeting-line" lang="hi-Latn">
          Aao, khana
        </span>
        <span className="welcome-greeting-line" lang="hi-Latn">
          tayyar hai!
        </span>
        <span className="welcome-greeting-translation">
          Come, food&rsquo;s ready.
        </span>
      </p>

      <div className="welcome-lantern-glow" aria-hidden="true" />

      <div className="welcome-steam" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      <Link href="/explore" className="welcome-cta" onClick={stepInside}>
        <span className="welcome-cta-label">Step inside</span>
        <span className="welcome-cta-arrow" aria-hidden="true">
          →
        </span>
      </Link>

      <div
        className="welcome-veil"
        data-active={entering || undefined}
        aria-hidden="true"
      />
    </>
  );
}
