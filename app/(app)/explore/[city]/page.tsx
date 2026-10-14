import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BackLink, SiteHeader } from "@/app/_components/site-header";
import { CityTables } from "./city-tables";
import {
  experienceHref,
  experiencesFor,
  exploreCities,
  findExploreCity,
} from "@/data/experiences";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ivory";

export function generateStaticParams() {
  return exploreCities.map((city) => ({ city: city.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/explore/[city]">): Promise<Metadata> {
  const city = findExploreCity((await params).city);
  return { title: city ? `${city.name} · Mehman` : "Mehman" };
}

export default async function CityPage({
  params,
}: PageProps<"/explore/[city]">) {
  const city = findExploreCity((await params).city);
  if (!city) notFound();
  const cityExperiences = experiencesFor(city);

  return (
    <div className="min-h-dvh bg-pine text-ivory">
      <SiteHeader current="explore" />
      <main className="mx-auto max-w-4xl px-4 pt-4 pb-[max(4rem,env(safe-area-inset-bottom))] md:px-10 md:pt-10 md:pb-24">
        <BackLink href="/explore">All cities</BackLink>

        <header className="mt-4 flex items-center gap-4 md:mt-6 md:gap-5">
          <Image
            src={city.thumbnail}
            alt=""
            sizes="80px"
            className="size-16 shrink-0 rounded-full object-cover ring-2 ring-ivory/80 ring-offset-2 ring-offset-pine md:size-20"
          />
          <div>
            <h1 className="font-serif text-3xl md:text-4xl">
              Food experiences in {city.name}
            </h1>
            <p className="mt-1 font-[family-name:var(--font-hand)] text-lg leading-snug text-terracotta-soft">
              {city.greeting.local}
            </p>
            <p className="text-sm text-ivory/55">{city.greeting.english}</p>
          </div>
        </header>
        <CityTables cityId={city.id} cityName={city.name} />

        <h2 className="mt-14 font-serif text-2xl md:text-3xl">
          More from {city.name}&rsquo;s kitchens
        </h2>
        <p className="mt-1 text-sm text-ivory/55">
          Ideas for tables we&rsquo;d love to see here. These can&rsquo;t be
          booked yet.
        </p>

        <ul className="mt-6 space-y-10 md:mt-8 md:space-y-12">
          {cityExperiences.map((experience) => (
            <li key={experience.id}>
              <Link
                href={experienceHref(experience, city)}
                className={`group grid gap-4 rounded-2xl transition-opacity active:opacity-80 motion-reduce:transition-none md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] md:items-center md:gap-10 ${focusRing}`}
              >
                <div>
                  <div className="relative -mx-4 aspect-[3/2] overflow-hidden bg-ivory/5 md:mx-0 md:rounded-2xl">
                    <Image
                      src={experience.image}
                      alt={experience.imageAlt}
                      fill
                      sizes="(min-width: 896px) 440px, (min-width: 768px) 50vw, 100vw"
                      className="object-cover"
                    />
                  </div>
                  <p className="mt-1.5 text-[11px] text-ivory/40">
                    Photo: {experience.credit.author},{" "}
                    {experience.credit.license}, via Wikimedia Commons
                  </p>
                </div>
                <div>
                  <p className="text-xs tracking-[0.2em] text-terracotta-soft uppercase">
                    Experience concept
                  </p>
                  <h3 className="mt-2 font-serif text-2xl decoration-terracotta-soft decoration-1 underline-offset-4 group-hover:underline md:text-3xl">
                    {experience.name}
                  </h3>
                  <p className="mt-2 text-base leading-relaxed text-ivory/75">
                    {experience.description}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
