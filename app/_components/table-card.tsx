"use client";

import Image from "next/image";
import Link from "next/link";
import { focusRing, formatPrice } from "./app-ui";
import { SaveButton } from "./save-button";
import { tableRating, useDemoState } from "@/lib/demo/store";
import type { DiningTable, Host } from "@/lib/demo/types";

const vegLabel = { veg: "Vegetarian", non_veg: "Non-vegetarian", both: "Veg & non-veg" };

// A family table in a grid. Phones: a wide photo with the price beside the
// title. Wider screens: Airbnb's listing card, with a square photo and
// title, host, date and price stacked underneath.
export function TableCard({
  table,
  host,
  kicker,
  footnote,
  highlight = false,
  dimmed = false,
  heading: Heading = "h3",
}: {
  table: DiningTable;
  host: Host | undefined;
  kicker?: string;
  footnote: string;
  highlight?: boolean;
  dimmed?: boolean;
  heading?: "h2" | "h3";
}) {
  const state = useDemoState();
  const rating = tableRating(state, table.id);

  return (
    <li className="relative">
      <Link href={`/tables/${table.id}`} className={`group block rounded-2xl ${focusRing}`}>
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-ivory/5 md:aspect-square md:rounded-xl">
          <Image
            src={table.photos[0]}
            alt=""
            fill
            sizes="(min-width: 1024px) 300px, (min-width: 768px) 33vw, 92vw"
            className={`object-cover transition-transform duration-700 group-hover:scale-105 ${dimmed ? "opacity-50 grayscale" : ""}`}
          />
          <span className="absolute top-3 left-3 rounded-full bg-pine/85 px-3 py-1 text-xs backdrop-blur md:bg-ivory md:font-medium md:text-pine md:shadow">
            {vegLabel[table.veg]}
          </span>
        </div>
        <div className="mt-3 flex items-start justify-between gap-3 md:block">
          <div className="min-w-0">
            {kicker && <p className="text-xs tracking-[0.15em] text-terracotta-soft uppercase md:hidden">{kicker}</p>}
            <div className="flex items-start justify-between gap-2">
              <Heading className="font-serif text-xl leading-snug md:truncate md:font-sans md:text-[15px] md:font-medium">
                <span className="hidden md:inline">{kicker ? `${kicker} · ` : ""}</span>
                {table.title}
              </Heading>
              {rating.count > 0 && (
                <p className="hidden shrink-0 text-[15px] md:block">
                  <span aria-hidden="true">★ </span>
                  <span className="sr-only">Rated </span>
                  {rating.average.toFixed(1)}
                </p>
              )}
            </div>
            <p className="truncate text-sm text-ivory/60 md:text-[15px]">
              <span className="hidden md:inline">Hosted by </span>
              {host?.displayName}
            </p>
            <p className={`mt-0.5 hidden text-[15px] md:block ${highlight ? "text-[#e8c08f]" : "text-ivory/60"}`}>{footnote}</p>
          </div>
          <p className="shrink-0 text-right md:mt-1.5 md:text-left md:text-[15px]">
            <span className="block font-medium md:inline">{formatPrice(table.pricePerGuest)}</span>
            <span className="block text-xs text-ivory/55 md:inline md:text-[15px] md:text-ivory/80"> per guest</span>
          </p>
        </div>
        <p className={`mt-1 text-sm md:hidden ${highlight ? "text-[#e8c08f]" : "text-ivory/55"}`}>{footnote}</p>
      </Link>
      <div className="absolute top-3 right-3 md:top-2 md:right-2">
        <SaveButton tableId={table.id} title={table.title} variant="overlay" />
      </div>
    </li>
  );
}
