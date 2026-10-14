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
  SampleDataNote,
  secondaryButtonClass,
  Stars,
} from "@/app/_components/app-ui";
import { primaryButtonClass } from "@/app/_components/fields";
import { BackLink } from "@/app/_components/site-header";
import { exploreCityHref, findExploreCity } from "@/data/experiences";
import {
  currentUser,
  hostForUser,
  requestBooking,
  seatsLeft,
  tableRating,
  upcomingSessions,
  useDemoReady,
  useDemoState,
} from "@/lib/demo/store";

const vegLabel = { veg: "Vegetarian", non_veg: "Non-vegetarian", both: "Veg & non-veg" };

export function TableScreen({ tableId }: { tableId: string }) {
  const state = useDemoState();
  const ready = useDemoReady();
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

  function submit() {
    setError(null);
    if (!selected) return setError("Please choose a date.");
    const result = requestBooking(selected.id, partySize, note);
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
            <Link href="/trips" className={primaryButtonClass}>See my trips</Link>
            <Link href={city ? exploreCityHref(city) : "/explore"} className={`rounded text-sm text-ivory/70 underline underline-offset-4 ${focusRing}`}>
              Keep exploring
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-28 md:pb-0">
      <div className="px-4 md:px-0">
        <BackLink href={city ? exploreCityHref(city) : "/explore"}>{city?.name ?? "Explore"}</BackLink>
      </div>

      {/* Photos: swipe on phones. */}
      <div className="no-scrollbar mt-3 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 md:px-0">
        {table.photos.map((photo, index) => (
          <div key={photo} className="relative aspect-[4/3] w-[88%] shrink-0 snap-center overflow-hidden rounded-2xl bg-ivory/5 md:w-[70%]">
            <Image src={photo} alt={index === 0 ? table.title : ""} fill sizes="(min-width: 768px) 520px, 88vw" className="object-cover" preload={index === 0} />
          </div>
        ))}
      </div>

      <div className="mt-6 space-y-8 px-4 md:px-0">
        <header>
          {table.status !== "approved" && (
            <p className="mb-3 rounded-xl bg-[#e8c08f]/15 px-4 py-2 text-sm text-[#e8c08f]">
              Only you can see this table until it&rsquo;s approved.
            </p>
          )}
          <p className="text-xs tracking-[0.2em] text-terracotta-soft uppercase">
            {table.cuisine} · {vegLabel[table.veg]}
          </p>
          <h1 className="mt-1 font-serif text-3xl leading-tight md:text-4xl">{table.title}</h1>
          {rating.count > 0 && (
            <a href="#reviews" className={`mt-1 inline-flex items-center gap-2 rounded text-sm text-ivory/75 ${focusRing}`}>
              <Stars rating={rating.average} /> {rating.average.toFixed(1)} · {rating.count} {rating.count === 1 ? "review" : "reviews"}
            </a>
          )}
          <p className="mt-2 text-lg">
            {formatPrice(table.pricePerGuest)} <span className="text-sm text-ivory/60">per guest · pay your host at the meal (UPI or cash)</span>
          </p>
        </header>

        <section className={cardClass}>
          <h2 className="text-sm tracking-[0.15em] text-ivory/55 uppercase">Your host</h2>
          <p className="mt-2 font-serif text-2xl">{host.displayName}</p>
          <p className="mt-1 text-sm text-ivory/60">Speaks {host.languages.join(", ")}</p>
          <p className="mt-3 leading-relaxed text-ivory/80">{host.bio}</p>
        </section>

        <section>
          <h2 className="font-serif text-2xl">The table</h2>
          <p className="mt-2 leading-relaxed text-ivory/80">{table.story}</p>
          <h3 className="mt-5 text-sm tracking-[0.15em] text-ivory/55 uppercase">On the menu</h3>
          <p className="mt-2 leading-relaxed text-ivory/80">{table.menu}</p>
          <p className="mt-3 text-sm text-ivory/55">Up to {table.maxGuests} guests · Menus change with the season.</p>
        </section>

        {rating.count > 0 && (
          <section id="reviews" className="scroll-mt-24">
            <h2 className="font-serif text-2xl">What guests said</h2>
            <ul className="mt-3 space-y-3">
              {rating.reviews.map((review) => (
                <li key={review.id} className={cardClass}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{state.profiles.find((p) => p.id === review.guestId)?.fullName.split(" ")[0]}</p>
                    <Stars rating={review.rating} />
                  </div>
                  <p className="mt-2 leading-relaxed text-ivory/85">&ldquo;{review.text}&rdquo;</p>
                  {review.hostReply && (
                    <p className="mt-3 border-l-2 border-[#e8c08f]/50 pl-3 text-sm text-ivory/70">
                      <span className="text-ivory/50">{host.displayName}: </span>
                      {review.hostReply}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section aria-labelledby={`${uid}-dates`}>
          <h2 id={`${uid}-dates`} className="font-serif text-2xl">Choose a date</h2>
          {sessions.length === 0 ? (
            <p className="mt-2 text-ivory/65">No open dates right now. Check back soon.</p>
          ) : (
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
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
                      className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition-colors disabled:opacity-45 ${focusRing} ${
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
              <h2 id={`${uid}-party`} className="font-serif text-2xl">Guests</h2>
              <div role="group" aria-labelledby={`${uid}-party`} className="flex items-center gap-4">
                <button type="button" onClick={() => setParty(Math.max(1, partySize - 1))} disabled={partySize <= 1} aria-label="One fewer guest" className={`grid size-11 place-items-center rounded-full border border-ivory/30 text-xl disabled:opacity-40 ${focusRing}`}>−</button>
                <span aria-live="polite" className="w-6 text-center text-xl">{partySize}</span>
                <button type="button" onClick={() => setParty(Math.min(maxParty, partySize + 1))} disabled={partySize >= maxParty} aria-label="One more guest" className={`grid size-11 place-items-center rounded-full border border-ivory/30 text-xl disabled:opacity-40 ${focusRing}`}>+</button>
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
                className="mt-2 block w-full rounded-2xl border border-ivory/25 bg-transparent px-4 py-3 text-base text-ivory placeholder:text-ivory/35 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ivory"
              />
            </div>
          </section>
        )}

        <SampleDataNote />
      </div>

      {/* Request bar: pinned above the tab bar on phones. */}
      {!isOwnTable && sessions.length > 0 && (
        <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 border-t border-ivory/10 bg-pine/95 px-4 py-3 backdrop-blur md:static md:mt-8 md:border-0 md:bg-transparent md:px-0">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="font-medium">{formatPrice(table.pricePerGuest * partySize)} <span className="text-sm font-normal text-ivory/60">for {partySize}</span></p>
              <p className="truncate text-xs text-ivory/55">{selected ? formatWhen(selected.startsAt) : "Choose a date"}</p>
              {error && <p role="alert" className="text-xs text-terracotta-soft">{error}</p>}
            </div>
            {user ? (
              <button type="button" onClick={submit} className={primaryButtonClass}>Request a seat</button>
            ) : (
              <Link href={loginHref} className={primaryButtonClass}>Log in to request</Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
