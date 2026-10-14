import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { BackLink, SiteHeader } from "@/app/_components/site-header";
import { exploreCities, findExploreCity } from "@/data/experiences";
import { CityTables } from "./city-tables";

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

  return (
    <div className="min-h-dvh bg-pine text-ivory">
      <SiteHeader current="explore" />
      <main className="mx-auto max-w-4xl px-4 pt-4 pb-16 md:px-10 md:pt-10 md:pb-24">
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
              Family tables in {city.name}
            </h1>
            <p className="mt-1 font-[family-name:var(--font-hand)] text-lg leading-snug text-terracotta-soft">
              {city.greeting.local}
            </p>
            <p className="text-sm text-ivory/55">{city.greeting.english}</p>
          </div>
        </header>

        <CityTables cityId={city.id} cityName={city.name} />
      </main>
    </div>
  );
}
