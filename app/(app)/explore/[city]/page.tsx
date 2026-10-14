import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
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
      <SiteHeader current="experiences" />
      <main className="mx-auto max-w-4xl px-4 pt-4 pb-16 md:px-10 md:pt-10 md:pb-24">
        <BackLink href="/explore">India map</BackLink>

        {/* Switch city without going back to the map. */}
        <nav aria-label="Cities" className="no-scrollbar -mx-4 mt-2 overflow-x-auto px-4">
          <ul className="flex w-max gap-2">
            {exploreCities.map((option) => {
              const isCurrent = option.id === city.id;
              return (
                <li key={option.id}>
                  <Link
                    href={`/explore/${option.id}`}
                    aria-current={isCurrent ? "page" : undefined}
                    className={`flex h-10 items-center gap-2 rounded-full border py-1 pr-4 pl-1 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ivory ${
                      isCurrent ? "border-[#e8c08f] bg-[#e8c08f]/15 text-[#e8c08f]" : "border-ivory/20 text-ivory/75"
                    }`}
                  >
                    <Image src={option.thumbnail} alt="" sizes="32px" className="size-8 rounded-full object-cover" />
                    {option.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <header className="mt-4 flex items-center gap-4 md:mt-6 md:gap-5">
          <Image
            src={city.thumbnail}
            alt=""
            sizes="80px"
            className="size-16 shrink-0 rounded-full object-cover ring-2 ring-ivory/80 ring-offset-2 ring-offset-pine md:size-20"
          />
          <div>
            <h1 className="font-serif text-3xl md:text-4xl">
              Home-dining in {city.name}
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
