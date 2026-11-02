"use client";

import Image from "next/image";
import Link from "next/link";
import { useId, useRef, useState } from "react";
import {
  cardClass,
  EmptyState,
  focusRing,
  formatPrice,
  formatWhen,
  secondaryButtonClass,
  Stars,
} from "@/app/_components/app-ui";
import { primaryButtonClass } from "@/app/_components/fields";
import { SaveButton } from "@/app/_components/save-button";
import { BackLink } from "@/app/_components/site-header";
import { exploreCityHref, findExploreCity } from "@/data/experiences";
import {
  currentUser,
  hostForUser,
  requestBooking,
  seatsLeft,
  tableRating,
  upcomingSessions,
  useAppReady,
  useAppState,
} from "@/lib/data/store";

const vegLabel = { veg: "Vegetarian", non_veg: "Non-vegetarian", both: "Veg & non-veg" };

export function TableScreen({ tableId }: { tableId: string }) {
  const state = useAppState();
  const ready = useAppReady();
  const uid = useId();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [party, setParty] = useState(2);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [requested, setRequested] = useState(false);
  const confirmRef = useRef<HTMLHeadingElement>(null);

  if (!ready) return <p className="py-16 text-center text-sm text-ivory/50">Loading…</p>;

  const table = state.tables.find((t) => t.id === tableId);
  const host = table && state.hosts.find((h) => h.id === table.hostId);
  const user = currentUser(state);
  const isOwnTable = Boolean(user && hostForUser(state, user.id)?.id === host?.id);
  const visible = table && host && (table.status === "approved" || isOwnTable || user?.role === "admin");

  if (!table || !host || !visible) {
    return (
      <div className="px-4">
        <EmptyState
          title="This table isn't open"
          action={<Link href="/explore" className={secondaryButtonClass}>Explore cities</Link>}
        >
          It may be paused by its host, or still being reviewed.
        </EmptyState>
      </div>
    );
  }

  const city = findExploreCity(host.cityId);
  const rating = tableRating(state, table.id);
  const sessions = upcomingSessions(state, table.id);
  const selected = sessions.find((s) => s.id === sessionId) ?? null;
  const selectedSeats = selected ? seatsLeft(state, selected) : table.maxGuests;
  const maxParty = Math.min(selectedSeats, table.maxGuests);
  const partySize = Math.min(party, Math.max(1, maxParty));
  const loginHref = `/login?next=${encodeURIComponent(`/tables/${table.id}`)}`;

  async function submit() {
    setError(null);
    if (!selected) return setError("Please choose a date.");
    const result = await requestBooking(selected.id, partySize, note);
    if ("error" in result) return setError(result.error);
    setRequested(true);
    requestAnimationFrame(() => confirmRef.current?.focus());
  }

  if (requested && selected) {
    return (
      <div className="px-4">
        <div className={`${cardClass} py-10 text-center`}>
          <p className="font-[family-name:var(--font-hand)] text-xl text-terracotta-soft">Shukriya!</p>
          <h1 ref={confirmRef} tabIndex={-1} className="mt-1 font-serif text-3xl outline-none">
            Your request is with {host.displayName}
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-ivory/70">
            {partySize} {partySize === 1 ? "seat" : "seats"} on {formatWhen(selected.startsAt)}. Hosts usually reply within a day. We&rsquo;ll share the address once they accept.
          </p>
          <div className="mt-7 flex flex-col items-center gap-3">
            <Link href="/bookings" className={primaryButtonClass}>See my bookings</Link>
            <Link href={city ? exploreCityHref(city) : "/explore"} className={`rounded text-sm text-ivory/70 underline underline-offset-4 ${focusRing}`}>
              Keep exploring
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const ratingLink = rating.count > 0 && (
    <a href="#reviews" className={`inline-flex items-center gap-2 rounded text-sm text-ivory/75 md:text-ivory md:underline md:underline-offset-4 ${focusRing}`}>
      <Stars rating={rating.average} className="md:hidden" />
      <span aria-hidden="true" className="hidden md:inline">★</span>
      {rating.average.toFixed(1)} · {rating.count} {rating.count === 1 ? "review" : "reviews"}
    </a>
  );
  const totalLine = (
    <p className="font-medium">
      {formatPrice(table.pricePerGuest * partySize)} <span className="text-sm font-normal text-ivory/60">for {partySize}</span>
    </p>
  );
  const requestButton = user ? (
    <button type="button" onClick={submit} className={primaryButtonClass}>Request a seat</button>
  ) : (
    <Link href={loginHref} className={primaryButtonClass}>Log in to request</Link>
  );
  const sectionRule = "md:border-t md:border-ivory/10 md:pt-8";

  return (
    <div className="flex flex-col pb-28 md:pb-0">
      {/* Phones: back and save above the photos. */}
      <div className="flex items-center justify-between px-4 md:hidden">
        <BackLink href={city ? exploreCityHref(city) : "/explore"}>{city?.name ?? "Explore"}</BackLink>
        {table.status === "approved" && <SaveButton tableId={table.id} title={table.title} />}
      </div>

      {/* Wider screens: Airbnb's title row above the photos. */}
      <div className="hidden items-end justify-between gap-6 md:flex">
        <div className="min-w-0">
          <h1 className="font-serif text-4xl leading-tight">{table.title}</h1>
          <p className="mt-2 flex flex-wrap items-center gap-x-2 text-[15px] text-ivory/75">
            {ratingLink}
            {rating.count > 0 && <span aria-hidden="true">·</span>}
            <span>{city?.name}</span>
            <span aria-hidden="true">·</span>
            <span>{table.cuisine} · {vegLabel[table.veg]}</span>
          </p>
        </div>
        {table.status === "approved" && <SaveButton tableId={table.id} title={table.title} variant="labelled" />}
      </div>

      {/* Photos: swipe on phones, a collage on wider screens. */}
      <div className="no-scrollbar mt-3 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 md:hidden">
        {table.photos.map((photo, index) => (
          <div key={photo} className="relative aspect-[4/3] w-[88%] shrink-0 snap-center overflow-hidden rounded-2xl bg-ivory/5">
            <Image src={photo} alt={index === 0 ? table.title : ""} fill sizes="88vw" className="object-cover" preload={index === 0} />
          </div>
        ))}
      </div>
      <PhotoCollage photos={table.photos} title={table.title} />

      <div className="mt-6 px-4 md:mt-10 md:grid md:grid-cols-[minmax(0,1fr)_22rem] md:gap-16 md:px-0 lg:gap-24">
        <div className="space-y-8">
          <header className="md:hidden">
            {table.status !== "approved" && <PendingNote />}
            <p className="text-xs tracking-[0.2em] text-terracotta-soft uppercase">
              {table.cuisine} · {vegLabel[table.veg]}
            </p>
            <h1 className="mt-1 font-serif text-3xl leading-tight">{table.title}</h1>
            {ratingLink && <div className="mt-1">{ratingLink}</div>}
            <p className="mt-2 text-lg">
              {formatPrice(table.pricePerGuest)} <span className="text-sm text-ivory/60">per guest · pay your host at the meal (UPI or cash)</span>
            </p>
          </header>
          {table.status !== "approved" && (
            <div className="hidden md:block">
              <PendingNote />
            </div>
          )}

          <section className={`${cardClass} md:rounded-none md:bg-transparent md:p-0`}>
            <h2 className="text-sm tracking-[0.15em] text-ivory/55 uppercase md:hidden">Your host</h2>
            <div className="md:flex md:items-center md:gap-4">
              <span aria-hidden="true" className="hidden size-12 shrink-0 place-items-center rounded-full bg-[#e8c08f] font-serif text-xl text-pine md:grid">
                {host.displayName.slice(0, 1)}
              </span>
              <div>
                <p className="mt-2 font-serif text-2xl md:mt-0 md:font-sans md:text-base md:font-medium">
                  <span className="hidden md:inline">Hosted by </span>
                  {host.displayName}
                </p>
                <p className="mt-1 text-sm text-ivory/60 md:mt-0">Speaks {host.languages.join(", ")}</p>
              </div>
            </div>
            <p className="mt-3 leading-relaxed text-ivory/80 md:mt-6">{host.bio}</p>
          </section>

          <section className={sectionRule}>
            <h2 className="font-serif text-2xl">The table</h2>
            <p className="mt-2 leading-relaxed text-ivory/80">{table.story}</p>
            <h3 className="mt-5 text-sm tracking-[0.15em] text-ivory/55 uppercase">On the menu</h3>
            <p className="mt-2 leading-relaxed text-ivory/80">{table.menu}</p>
            <p className="mt-3 text-sm text-ivory/55">Up to {table.maxGuests} guests · Menus change with the season.</p>
          </section>

          {rating.count > 0 && (
            <section id="reviews" className={`scroll-mt-24 ${sectionRule}`}>
              <h2 className="font-serif text-2xl">
                <span className="hidden md:inline">★ {rating.average.toFixed(1)} · {rating.count} {rating.count === 1 ? "review" : "reviews"}</span>
                <span className="md:hidden">What guests said</span>
              </h2>
              <ul className="mt-3 space-y-3 md:mt-6 md:grid md:grid-cols-2 md:gap-x-12 md:gap-y-8 md:space-y-0">
                {rating.reviews.map((review) => {
                  const firstName = state.profiles.find((p) => p.id === review.guestId)?.fullName.split(" ")[0] ?? "Guest";
                  return (
                    <li key={review.id} className={`${cardClass} md:rounded-none md:bg-transparent md:p-0`}>
                      <div className="flex items-center justify-between gap-3 md:justify-start">
                        <span aria-hidden="true" className="hidden size-10 shrink-0 place-items-center rounded-full bg-ivory/15 font-medium md:grid">
                          {firstName.slice(0, 1)}
                        </span>
                        <p className="font-medium">{firstName}</p>
                        <Stars rating={review.rating} className="md:ml-auto" />
                      </div>
                      <p className="mt-2 leading-relaxed text-ivory/85 md:mt-3">&ldquo;{review.text}&rdquo;</p>
                      {review.hostReply && (
                        <p className="mt-3 border-l-2 border-[#e8c08f]/50 pl-3 text-sm text-ivory/70">
                          <span className="text-ivory/50">{host.displayName}: </span>
                          {review.hostReply}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          <div className="hidden md:block">
          </div>
        </div>

        {/* Phones: dates and guests follow the story. Wider screens: a
            booking box that stays in view, like Airbnb's. */}
        <aside className="mt-8 md:mt-0">
          <div className="space-y-8 md:sticky md:top-8 md:space-y-6 md:rounded-2xl md:border md:border-ivory/15 md:bg-forest-deep md:p-6 md:shadow-[0_6px_24px_rgb(0_0_0/0.4)]">
            <p className="hidden md:block">
              <span className="font-serif text-2xl">{formatPrice(table.pricePerGuest)}</span>
              <span className="text-ivory/65"> per guest</span>
            </p>

            <section aria-labelledby={`${uid}-dates`}>
              <h2 id={`${uid}-dates`} className="font-serif text-2xl md:font-sans md:text-xs md:font-medium md:tracking-[0.15em] md:text-ivory/60 md:uppercase">Choose a date</h2>
              {sessions.length === 0 ? (
                <p className="mt-2 text-ivory/65">No open dates right now. Check back soon.</p>
              ) : (
                <ul className="mt-3 grid gap-2 sm:grid-cols-2 md:max-h-64 md:grid-cols-1 md:overflow-y-auto">
                  {sessions.map((session) => {
                    const left = seatsLeft(state, session);
                    const full = left <= 0;
                    const isSelected = session.id === sessionId;
                    return (
                      <li key={session.id}>
                        <button
                          type="button"
                          disabled={full || isOwnTable}
                          aria-pressed={isSelected}
                          onClick={() => setSessionId(session.id)}
                          className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition-colors disabled:opacity-45 md:rounded-xl md:py-2.5 md:text-sm ${focusRing} ${
                            isSelected ? "border-[#e8c08f] bg-[#e8c08f]/10" : "border-ivory/15 hover:border-ivory/40"
                          }`}
                        >
                          <span>{formatWhen(session.startsAt)}</span>
                          <span className="text-sm text-ivory/60">{full ? "Full" : `${left} left`}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            {!isOwnTable && sessions.length > 0 && (
              <section className="space-y-5">
                <div className="flex items-center justify-between">
                  <h2 id={`${uid}-party`} className="font-serif text-2xl md:font-sans md:text-xs md:font-medium md:tracking-[0.15em] md:text-ivory/60 md:uppercase">Guests</h2>
                  <div role="group" aria-labelledby={`${uid}-party`} className="flex items-center gap-4">
                    <button type="button" onClick={() => setParty(Math.max(1, partySize - 1))} disabled={partySize <= 1} aria-label="One fewer guest" className={`grid size-11 place-items-center rounded-full border border-ivory/30 text-xl disabled:opacity-40 md:size-9 ${focusRing}`}>−</button>
                    <span aria-live="polite" className="w-6 text-center text-xl md:text-base">{partySize}</span>
                    <button type="button" onClick={() => setParty(Math.min(maxParty, partySize + 1))} disabled={partySize >= maxParty} aria-label="One more guest" className={`grid size-11 place-items-center rounded-full border border-ivory/30 text-xl disabled:opacity-40 md:size-9 ${focusRing}`}>+</button>
                  </div>
                </div>
                <div>
                  <label htmlFor={`${uid}-note`} className="text-sm text-ivory/80">
                    A note for your host <span className="text-ivory/50">(optional)</span>
                  </label>
                  <textarea
                    id={`${uid}-note`}
                    rows={3}
                    maxLength={400}
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="Allergies, who's coming, why you'd love this meal…"
                    className="mt-2 block w-full rounded-2xl border border-ivory/25 bg-transparent px-4 py-3 text-base text-ivory placeholder:text-ivory/35 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ivory md:rounded-xl md:text-sm"
                  />
                </div>
              </section>
            )}

            {!isOwnTable && sessions.length > 0 && (
              <div className="hidden space-y-3 md:block">
                <div className="[&>a]:w-full [&>button]:w-full">{requestButton}</div>
                {error && <p role="alert" className="text-center text-sm text-terracotta-soft">{error}</p>}
                <p className="text-center text-sm text-ivory/55">You won&rsquo;t pay now. Pay your host at the meal (UPI or cash).</p>
                <div className="flex items-center justify-between border-t border-ivory/10 pt-4">
                  <span className="text-ivory/75">
                    {formatPrice(table.pricePerGuest)} × {partySize} {partySize === 1 ? "guest" : "guests"}
                  </span>
                  {totalLine}
                </div>
              </div>
            )}
          </div>
        </aside>

        <div className="mt-8 md:hidden">
        </div>
      </div>

      {/* Phones: the request bar is pinned above the tab bar. */}
      {!isOwnTable && sessions.length > 0 && (
        <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 border-t border-ivory/10 bg-pine/95 px-4 py-3 backdrop-blur md:hidden">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
            <div className="min-w-0">
              {totalLine}
              <p className="truncate text-xs text-ivory/55">{selected ? formatWhen(selected.startsAt) : "Choose a date"}</p>
              {error && <p role="alert" className="text-xs text-terracotta-soft">{error}</p>}
            </div>
            {requestButton}
          </div>
        </div>
      )}
    </div>
  );
}

function PendingNote() {
  return (
    <p className="mb-3 rounded-xl bg-[#e8c08f]/15 px-4 py-2 text-sm text-[#e8c08f]">
      Only you can see this table until it&rsquo;s approved.
    </p>
  );
}

// Airbnb's photo grid: one large photo and up to four smaller ones.
function PhotoCollage({ photos, title }: { photos: string[]; title: string }) {
  const shown = photos.slice(0, 5);
  const n = shown.length;
  const cell = (index: number) => {
    if (n === 1) return "col-span-4 row-span-2";
    if (n === 2) return "col-span-2 row-span-2";
    if (index === 0) return "col-span-2 row-span-2";
    if (n === 3 || (n === 4 && index === 1)) return "col-span-2";
    return "";
  };

  return (
    <div className="mt-6 hidden h-[clamp(20rem,38vw,30rem)] grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-2xl md:grid">
      {shown.map((photo, index) => (
        <div key={photo} className={`group relative overflow-hidden bg-ivory/5 ${cell(index)}`}>
          <Image
            src={photo}
            alt={index === 0 ? title : ""}
            fill
            sizes={index === 0 || n <= 2 ? "(min-width: 1280px) 640px, 50vw" : "320px"}
            className="object-cover transition duration-500 group-hover:brightness-90"
            preload={index === 0}
          />
        </div>
      ))}
    </div>
  );
}
