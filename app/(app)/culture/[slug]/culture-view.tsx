import Link from "next/link";
import { primaryButtonClass } from "@/app/_components/fields";
import { BackLink, SiteHeader } from "@/app/_components/site-header";
import {
  earlyAccessHref,
  exploreHref,
  type CulturalRegion,
  type DiningCity,
} from "@/data/discovery";

const formats = [
  {
    name: "Shared Table",
    description:
      "Reserve a seat at a hosted meal and dine alongside other guests.",
  },
  {
    name: "Private Table",
    description:
      "Reserve an entire hosted session for your group, with no other paying guests.",
  },
];

const eyebrow = "text-xs tracking-[0.2em] text-ivory/55 uppercase";

type CultureViewProps = {
  region: CulturalRegion;
  // Undefined while the dining city is still being resolved.
  city?: DiningCity;
};

export function CultureView({ region, city }: CultureViewProps) {
  const backHref = city ? exploreHref(city, region) : "/explore";

  return (
    <div className="min-h-dvh bg-pine text-ivory">
      <SiteHeader current="explore" exploreHref={backHref} />

      <main className="mx-auto max-w-5xl px-4 pt-6 pb-[max(4rem,env(safe-area-inset-bottom))] md:px-10 md:pt-12 md:pb-28">
        <BackLink href={backHref}>Back to Explore</BackLink>

        <header className="mt-8 max-w-3xl md:mt-12">
          <h1 className="font-serif text-5xl leading-[1.05] md:text-7xl">
            A taste of {region.name}
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-ivory/80 md:mt-7 md:text-xl">
            {region.intro}
          </p>
        </header>

        <section
          aria-labelledby={`${region.id}-dishes`}
          className="mt-14 md:mt-20"
        >
          <h2 id={`${region.id}-dishes`} className={eyebrow}>
            Signature dishes
          </h2>
          <ul className="mt-4 grid border-t border-ivory/15 md:grid-cols-3 md:gap-10">
            {region.dishes.map((dish) => (
              <li
                key={dish.name}
                className="border-b border-ivory/15 py-5 md:border-b-0 md:pt-6"
              >
                <h3 className="font-serif text-2xl">{dish.name}</h3>
                <p className="mt-2 text-base leading-relaxed text-ivory/70">
                  {dish.description}
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-ivory/45">
            A few examples. Every family cooks its own way.
          </p>
        </section>

        <section
          aria-labelledby={`${region.id}-table`}
          className="mt-14 grid gap-6 md:mt-20 md:grid-cols-[1fr_1.4fr] md:gap-16"
        >
          <h2
            id={`${region.id}-table`}
            className="font-serif text-3xl md:text-4xl"
          >
            At the family table
          </h2>
          <div className="space-y-5 text-lg leading-relaxed">
            <p className="text-ivory/80">{region.tradition}</p>
            <p className="border-l-2 border-terracotta-soft/70 pl-5 font-serif text-xl text-ivory italic">
              Imagine sitting around a family table, sharing {region.mealPhrase}
              , and hearing the stories behind the recipes.
            </p>
          </div>
        </section>

        <section
          aria-labelledby={`${region.id}-mehman`}
          className="mt-14 grid gap-6 md:mt-20 md:grid-cols-[1fr_1.4fr] md:gap-16"
        >
          <h2
            id={`${region.id}-mehman`}
            className="font-serif text-3xl md:text-4xl"
          >
            Dining with Mehman
          </h2>
          <div>
            <p className="text-lg leading-relaxed text-ivory/80">
              Mehman is building a way for guests to share a home-cooked
              regional meal with a host family, in the family&rsquo;s own home.
              We are planning two ways to dine.
            </p>
            <dl className="mt-8 grid gap-6 sm:grid-cols-2 sm:gap-8">
              {formats.map((format) => (
                <div
                  key={format.name}
                  className="border-t border-ivory/15 pt-4"
                >
                  <dt className="font-serif text-2xl">{format.name}</dt>
                  <dd className="mt-2 text-base leading-relaxed text-ivory/70">
                    {format.description}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-6 text-sm text-ivory/55">
              In both, you spend the meal with the host family. These formats
              are planned and not yet available to book.
            </p>
          </div>
        </section>

        <section
          aria-label="Early access"
          className={`mt-16 border-t border-ivory/15 pt-10 md:mt-24 md:flex md:items-center md:justify-between md:gap-10 ${city ? "" : "invisible"}`}
        >
          <p className="text-base text-ivory/70">
            {city ? `Dining in ${city.name}, exploring ${region.name}.` : " "}
          </p>
          <Link
            href={city ? earlyAccessHref(city, region) : "/early-access"}
            className={`${primaryButtonClass} mt-5 w-full md:mt-0 md:w-auto`}
          >
            Get early access
            <span aria-hidden="true">→</span>
          </Link>
        </section>
      </main>
    </div>
  );
}
