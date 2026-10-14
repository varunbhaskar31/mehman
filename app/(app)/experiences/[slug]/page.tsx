import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BackLink, SiteHeader } from "@/app/_components/site-header";
import { experiences, findExperience } from "@/data/experiences";
import { CityBackLink } from "./city-back-link";

export function generateStaticParams() {
  return experiences.map((experience) => ({ slug: experience.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/experiences/[slug]">): Promise<Metadata> {
  const experience = findExperience((await params).slug);
  return { title: experience ? `${experience.name} · Mehman` : "Mehman" };
}

export default async function ExperiencePage({
  params,
}: PageProps<"/experiences/[slug]">) {
  const experience = findExperience((await params).slug);
  if (!experience) notFound();
  const { credit } = experience;
  const creditLink =
    "underline decoration-ivory/25 underline-offset-2 hover:text-ivory/80";

  return (
    <div className="min-h-dvh bg-pine text-ivory">
      <SiteHeader current="explore" />
      <main className="mx-auto max-w-3xl px-4 pt-4 pb-[max(4rem,env(safe-area-inset-bottom))] md:px-10 md:pt-10 md:pb-24">
        <Suspense
          fallback={<BackLink href="/explore">Back to Explore</BackLink>}
        >
          <CityBackLink />
        </Suspense>

        <figure className="mt-4 md:mt-6">
          <div className="relative aspect-[3/2] overflow-hidden rounded-2xl bg-ivory/5">
            <Image
              src={experience.image}
              alt={experience.imageAlt}
              fill
              preload
              sizes="(min-width: 768px) 688px, 100vw"
              className="object-cover"
            />
          </div>
          <figcaption className="mt-2 text-xs text-ivory/45">
            Photo:{" "}
            <a href={credit.sourceUrl} className={creditLink}>
              {credit.author}
            </a>
            ,{" "}
            <a href={credit.licenseUrl} className={creditLink}>
              {credit.license}
            </a>
            , via Wikimedia Commons
          </figcaption>
        </figure>

        <p className="mt-8 text-xs tracking-[0.2em] text-terracotta-soft uppercase md:mt-10">
          Experience concept
        </p>
        <h1 className="mt-3 font-serif text-4xl leading-tight md:text-5xl">
          {experience.name}
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-ivory/80">
          {experience.description}
        </p>
        <p className="mt-8 border-t border-ivory/15 pt-6 text-base leading-relaxed text-ivory/60">
          This is an illustrative concept. Mehman hasn&rsquo;t onboarded host
          families yet, so it can&rsquo;t be booked.
        </p>
      </main>
    </div>
  );
}
