"use client";

import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import { useEffect, useRef, type CSSProperties } from "react";
import exploreScene from "@/assets/explore-scene.jpg";
import welcomeArtwork from "@/assets/welcome-artwork.png";
import { findExperience, type Experience } from "@/data/experiences";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ivory";

function photo(id: string): Experience {
  const experience = findExperience(id);
  if (!experience) throw new Error(`Unknown experience photo: ${id}`);
  return experience;
}

function Credit({ experience }: { experience: Experience }) {
  return (
    <>
      {experience.credit.author}, {experience.credit.license}
    </>
  );
}

// A photo that opens like a curtain and drifts slowly closer.
function StoryPhoto({
  src,
  alt,
  className = "",
}: {
  src: StaticImageData;
  alt: string;
  className?: string;
}) {
  return (
    <div className={`story-photo ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(min-width: 768px) 480px, 92vw"
        className="story-photo-img"
      />
    </div>
  );
}

// Words light up one after another as the line scrolls into view.
function RevealLine({ text }: { text: string }) {
  return (
    <>
      {text.split(" ").map((word, index) => (
        <span
          key={index}
          className="story-word"
          style={{ "--i": index } as CSSProperties}
        >
          {word}{" "}
        </span>
      ))}
    </>
  );
}

const remembered = [
  photo("dal-baati-churma-experience"),
  photo("syrian-christian-home-meal"),
  photo("bengali-fish-meal"),
];
const slowCooked = photo("lucknowi-home-meal");
const bananaLeaf = photo("karnataka-home-meal");

export function OurStory() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const parts = [...root.querySelectorAll<HTMLElement>("[data-reveal]")];
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.setAttribute("data-visible", "");
          }
        }
      },
      { rootMargin: "0px 0px -15% 0px", threshold: 0.2 },
    );
    parts.forEach((part) => observer.observe(part));
    return () => {
      observer.disconnect();
      parts.forEach((part) => part.removeAttribute("data-visible"));
    };
  }, []);

  return (
    <div ref={rootRef}>
      {/* Opening: the kitchen where every story here begins. */}
      <section className="story-hero">
        <div className="story-hero-frame">
          <Image
            src={welcomeArtwork}
            alt="A painted home kitchen at dusk: a host by the stove, a lantern, steaming pots and an open window."
            fill
            preload
            sizes="(min-width: 768px) 1152px, 100vw"
            className="story-hero-art"
          />
        </div>
        <div className="story-hero-text">
          <p className="story-kicker">Atithi Devo Bhava</p>
          <h1 className="story-hero-title font-serif">
            It began at someone else&rsquo;s table.
          </h1>
          <p className="story-hero-lead">
            The guest is god. India has said it for thousands of years. We
            just wanted more people to feel it.
          </p>
        </div>
        <span className="story-scroll-cue" aria-hidden="true" />
      </section>

      <div className="mx-auto max-w-5xl px-4 md:px-10">
        <section data-reveal className="story-chapter">
          <div className="story-chapter-text">
            <p className="story-chapter-label">Two friends</p>
            <h2 className="story-chapter-title font-serif">
              A habit of getting lost
            </h2>
            <p>
              We were two friends who travelled the same way every time: no
              plan, a train ticket and a big appetite. We skipped the famous
              restaurants and followed the smell of tadka out of open windows.
            </p>
            <p>
              Somewhere along the way, strangers started calling us in.
              &ldquo;Khana khaya?&rdquo; Have you eaten? It was never really a
              question.
            </p>
          </div>
          <div className="story-chapter-visual">
            <StoryPhoto
              src={exploreScene}
              alt="An India-shaped brass platter of regional dishes on a dark green table."
            />
          </div>
        </section>

        <section data-reveal className="story-chapter story-chapter-flip">
          <div className="story-chapter-text">
            <p className="story-chapter-label">The meals we carried home</p>
            <h2 className="story-chapter-title font-serif">
              Food that tasted like someone&rsquo;s childhood
            </h2>
            <p>
              Dal baati broken by hand in a Rajasthani courtyard. Appam and
              stew on a Kerala Sunday. Mustard fish that a mother refused to
              let us leave without. None of it was on a menu.
            </p>
            <p>
              What we remembered wasn&rsquo;t only the taste. It was who
              cooked it, why, and the story they told while we ate.
            </p>
          </div>
          <div className="story-chapter-visual">
            <div className="story-fan">
              {remembered.map((experience, index) => (
                <div
                  key={experience.id}
                  className="story-fan-card"
                  style={{ "--i": index } as CSSProperties}
                >
                  <Image
                    src={experience.image}
                    alt={experience.imageAlt}
                    fill
                    sizes="(min-width: 768px) 260px, 55vw"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section data-reveal className="story-chapter">
          <div className="story-chapter-text">
            <p className="story-chapter-label">What we saw slipping away</p>
            <h2 className="story-chapter-title font-serif">
              Recipes that live only in memory
            </h2>
            <p>
              Most of these dishes have never been written down. They pass
              from hand to hand, a pinch here, &ldquo;cook until it smells
              right&rdquo; there. Every generation, a little more goes quiet.
            </p>
            <p>
              When a recipe is lost, it isn&rsquo;t just food. It&rsquo;s a
              festival, a dialect, a grandmother&rsquo;s way of saying she
              loves you.
            </p>
          </div>
          <div className="story-chapter-visual">
            <StoryPhoto src={slowCooked.image} alt={slowCooked.imageAlt} />
          </div>
        </section>

        <section data-reveal className="story-quote">
          <p className="font-serif">
            <RevealLine text="Every recipe is a family's memory. Every meal is an invitation." />
          </p>
        </section>

        <section data-reveal className="story-chapter story-chapter-flip">
          <div className="story-chapter-text">
            <p className="story-chapter-label">So we built Mehman</p>
            <h2 className="story-chapter-title font-serif">
              Knitting kitchens and travellers together
            </h2>
            <p>
              Mehman means guest. We&rsquo;re bringing families who cook with
              love together with people who travel to understand, so that
              these tables stay set and these stories keep being told.
            </p>
            <p>
              You don&rsquo;t just eat. You sit on the floor or at the dining
              table, you ask for seconds, you learn why the pickle is made
              only in summer. You leave as family.
            </p>
          </div>
          <div className="story-chapter-visual">
            <StoryPhoto src={bananaLeaf.image} alt={bananaLeaf.imageAlt} />
          </div>
        </section>

        <section data-reveal className="story-closing">
          <p className="story-kicker">Aao, khana tayyar hai</p>
          <h2 className="font-serif text-3xl md:text-5xl">
            Come. The food is ready.
          </h2>
          <div className="mt-8 flex flex-col items-center gap-4">
            <Link
              href="/explore"
              className={`inline-flex h-12 items-center rounded-full bg-terracotta px-7 font-medium text-ivory transition-transform hover:bg-[#b5532c] active:scale-95 ${focusRing}`}
            >
              Find a table
            </Link>
            <p className="text-sm text-ivory/70">
              Have a family recipe to share?{" "}
              <Link
                href="/become-a-host"
                className={`rounded text-ivory underline decoration-terracotta-soft underline-offset-4 ${focusRing}`}
              >
                Become a host
              </Link>
            </p>
          </div>
        </section>

        <p className="pb-[max(3rem,env(safe-area-inset-bottom))] text-center text-[11px] leading-relaxed text-ivory/40">
          Photos via Wikimedia Commons:{" "}
          {[...remembered, slowCooked, bananaLeaf].map((experience, index) => (
            <span key={experience.id}>
              {index > 0 && " · "}
              <Credit experience={experience} />
            </span>
          ))}
          .
        </p>
      </div>
    </div>
  );
}
