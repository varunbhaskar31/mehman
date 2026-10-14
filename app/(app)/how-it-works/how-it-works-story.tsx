"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import {
  exploreCities,
  findExperience,
  type Experience,
} from "@/data/experiences";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ivory";

function photo(id: string): Experience {
  const experience = findExperience(id);
  if (!experience) throw new Error(`Unknown experience photo: ${id}`);
  return experience;
}

const heroPhotos = [
  "kerala-sadya",
  "rajasthani-family-thali",
  "bengali-fish-meal",
  "hyderabadi-home-feast",
  "dal-baati-churma-experience",
  "syrian-christian-home-meal",
].map(photo);

type Step = {
  title: string;
  body: string;
  visual: ReactNode;
};

function PhotoCard({ experience }: { experience: Experience }) {
  return (
    <figure>
      <div className="hiw-photo">
        <Image
          src={experience.image}
          alt={experience.imageAlt}
          fill
          sizes="(min-width: 768px) 420px, 90vw"
          className="hiw-photo-img"
        />
      </div>
      <figcaption className="mt-1.5 text-[11px] text-ivory/40">
        Photo: {experience.credit.author}, {experience.credit.license}, via
        Wikimedia Commons
      </figcaption>
    </figure>
  );
}

const steps: Step[] = [
  {
    title: "Choose your city",
    body: "Start with where you are, or where you’re headed. Each city has its own kitchens, its own festivals and its own way of saying welcome.",
    visual: (
      <ul className="hiw-cities" aria-hidden="true">
        {exploreCities.map((city, index) => (
          <li
            key={city.id}
            style={{ "--i": index } as CSSProperties}
            className="hiw-city"
          >
            <Image
              src={city.thumbnail}
              alt=""
              sizes="72px"
              className="size-16 rounded-full object-cover md:size-[4.5rem]"
            />
            <span>{city.name}</span>
          </li>
        ))}
      </ul>
    ),
  },
  {
    title: "Pick a family’s table",
    body: "Browse home meals, from a Kerala sadya on a banana leaf to a Rajasthani thali. Every table is a family’s own recipes, not a restaurant menu.",
    visual: <PhotoCard experience={photo("kerala-sadya")} />,
  },
  {
    title: "Ask for a seat",
    body: "Send a request for the day you’d like. The family confirms when it suits their kitchen, and tells you anything you should know before you arrive.",
    visual: <PhotoCard experience={photo("rajasthani-family-thali")} />,
  },
  {
    title: "Arrive as a guest, leave as family",
    body: "Sit down to a meal served the way it is at home, course by course, with the stories behind each dish. You came as a mehman.",
    visual: <PhotoCard experience={photo("bengali-family-lunch")} />,
  },
];

export function HowItWorksStory() {
  const listRef = useRef<HTMLOListElement>(null);

  // Steps reveal as they scroll into view, and a gold thread grows down
  // through them to show how far along the journey the reader is.
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const items = [...list.querySelectorAll<HTMLElement>("[data-step]")];

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.setAttribute("data-visible", "");
          }
        }
      },
      { rootMargin: "0px 0px -20% 0px", threshold: 0.15 },
    );
    items.forEach((item) => observer.observe(item));

    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = list.getBoundingClientRect();
      const reached = window.innerHeight * 0.6 - rect.top;
      const progress = Math.min(1, Math.max(0, reached / rect.height));
      list.style.setProperty("--progress", progress.toFixed(3));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
      items.forEach((item) => item.removeAttribute("data-visible"));
    };
  }, []);

  return (
    <>
      <section className="px-4 pt-6 text-center md:pt-12">
        <p className="hiw-kicker">Aao, baitho, khao</p>
        <h1 className="hiw-title font-serif text-4xl md:text-6xl">
          How Mehman works
        </h1>
        <p className="hiw-lead mx-auto mt-3 max-w-md text-base text-ivory/70 md:text-lg">
          From your city to a family&rsquo;s table, in four simple steps.
        </p>
      </section>

      {/* A slow, endless ribbon of home meals. */}
      <div className="hiw-ribbon mt-8 md:mt-12" aria-hidden="true">
        <div className="hiw-ribbon-track">
          {[...heroPhotos, ...heroPhotos].map((experience, index) => (
            <div key={index} className="hiw-ribbon-photo">
              <Image
                src={experience.image}
                alt=""
                fill
                sizes="240px"
                className="object-cover"
              />
            </div>
          ))}
        </div>
      </div>

      <ol ref={listRef} className="hiw-steps">
        {steps.map((step, index) => (
          <li key={step.title} data-step className="hiw-step">
            <span className="hiw-step-number" aria-hidden="true">
              {index + 1}
            </span>
            <div className="hiw-step-text">
              <p className="text-xs tracking-[0.2em] text-terracotta-soft uppercase">
                Step {index + 1}
              </p>
              <h2 className="mt-1 font-serif text-2xl md:text-3xl">
                {step.title}
              </h2>
              <p className="mt-2 text-base leading-relaxed text-ivory/75">
                {step.body}
              </p>
            </div>
            <div className="hiw-step-visual">{step.visual}</div>
          </li>
        ))}
      </ol>

      <section className="mx-auto max-w-md px-4 pb-[max(4rem,env(safe-area-inset-bottom))] text-center md:pb-24">
        <p className="text-sm text-ivory/55">
          Mehman is just getting started. We&rsquo;re meeting host families
          now, so tables can&rsquo;t be booked yet.
        </p>
        <Link
          href="/explore"
          className={`mt-6 inline-flex h-12 items-center rounded-full bg-terracotta px-7 font-medium text-ivory transition-transform hover:bg-[#b5532c] active:scale-95 ${focusRing}`}
        >
          Explore cities
        </Link>
        <p className="mt-5 text-sm text-ivory/70">
          Love feeding people?{" "}
          <Link
            href="/become-a-host"
            className={`rounded text-ivory underline decoration-terracotta-soft underline-offset-4 ${focusRing}`}
          >
            Become a host
          </Link>
        </p>
      </section>
    </>
  );
}
