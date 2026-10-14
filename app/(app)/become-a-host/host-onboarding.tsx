"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, type ChangeEvent } from "react";
import {
  cardClass,
  focusRing,
  formatPrice,
  formatWhen,
  SampleDataNote,
  secondaryButtonClass,
} from "@/app/_components/app-ui";
import { primaryButtonClass, SelectField, TextField } from "@/app/_components/fields";
import { exploreCities } from "@/data/experiences";
import {
  applyAsHost,
  currentUser,
  hostForUser,
  useDemoReady,
  useDemoState,
} from "@/lib/demo/store";
import type { VegType } from "@/lib/demo/types";
import { resizePhoto } from "@/lib/photos";

const LANGUAGES = ["Hindi", "English", "Bengali", "Kannada", "Malayalam", "Marathi", "Tamil", "Telugu", "Urdu", "Gujarati", "Punjabi", "Marwari"];
const STEPS = ["About you", "Your home", "Your table", "Photos", "Dates", "Review"] as const;
const MAX_PHOTOS = 6;

type Draft = {
  displayName: string;
  bio: string;
  languages: string[];
  cityId: string;
  address: string;
  contactPhone: string;
  title: string;
  cuisine: string;
  veg: VegType;
  story: string;
  menu: string;
  pricePerGuest: string;
  maxGuests: number;
  photos: string[];
  dates: { startsAt: string; seats: number }[];
};

const emptyDraft: Draft = {
  displayName: "",
  bio: "",
  languages: [],
  cityId: exploreCities[0].id,
  address: "",
  contactPhone: "",
  title: "",
  cuisine: "",
  veg: "veg",
  story: "",
  menu: "",
  pricePerGuest: "",
  maxGuests: 6,
  photos: [],
  dates: [],
};

type Errors = Partial<Record<keyof Draft | "newDate", string>>;

function validateStep(step: number, d: Draft): Errors {
  const e: Errors = {};
  if (step === 0) {
    if (d.displayName.trim().length < 3) e.displayName = "Give your table a name guests will see.";
    if (d.bio.trim().length < 30) e.bio = "Tell guests a little more (at least 30 characters).";
    if (d.languages.length === 0) e.languages = "Pick at least one language.";
  }
  if (step === 1) {
    if (d.address.trim().length < 10) e.address = "Please enter your full address.";
    if (d.contactPhone.replace(/\D/g, "").length < 10) e.contactPhone = "Please enter a mobile number guests can reach on the day.";
  }
  if (step === 2) {
    if (d.title.trim().length < 5) e.title = "Name the meal you'll serve.";
    if (d.cuisine.trim().length < 3) e.cuisine = "Which cuisine or tradition is it?";
    if (d.story.trim().length < 30) e.story = "Tell guests what makes this meal yours (at least 30 characters).";
    if (d.menu.trim().length < 10) e.menu = "List the dishes you usually serve.";
    const price = Number(d.pricePerGuest);
    if (!Number.isInteger(price) || price < 100 || price > 50000) e.pricePerGuest = "Enter a price between ₹100 and ₹50,000.";
  }
  if (step === 3 && d.photos.length === 0) e.photos = "Add at least one photo of your food or table.";
  if (step === 4 && d.dates.length === 0) e.dates = "Add at least one date you can host.";
  return e;
}

const vegOptions: { id: VegType; label: string }[] = [
  { id: "veg", label: "Vegetarian" },
  { id: "non_veg", label: "Non-vegetarian" },
  { id: "both", label: "Both" },
];

export function HostOnboarding() {
  const state = useDemoState();
  const ready = useDemoReady();
  const router = useRouter();
  const uid = useId();
  const f = (name: string) => `${uid}-${name}`;
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [errors, setErrors] = useState<Errors>({});
  const [newDate, setNewDate] = useState("");
  const [newSeats, setNewSeats] = useState(6);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (started) {
      headingRef.current?.focus();
      window.scrollTo({ top: 0 });
    }
  }, [step, started]);

  if (!ready) return <p className="py-16 text-center text-sm text-ivory/50">Loading…</p>;

  const user = currentUser(state);
  const host = hostForUser(state, user?.id);
  const set = <K extends keyof Draft>(key: K) => (value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  if (host) {
    return (
      <div className={`${cardClass} text-center`}>
        <p className="font-serif text-2xl">You&rsquo;ve already applied</p>
        <p className="mt-2 text-sm text-ivory/65">Manage your table, dates and guests from your dashboard.</p>
        <Link href="/host" className={`${primaryButtonClass} mt-6`}>Go to hosting dashboard</Link>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="space-y-6">
        <ol className="space-y-4">
          {[
            ["Tell us about your family and kitchen", "Your story, your city and the meal you love to serve."],
            ["We visit and review", "The Mehman team checks every home before it goes live, for guests' safety and yours."],
            ["Welcome your first guests", "You choose the dates and accept each request. Guests pay you directly at the meal."],
          ].map(([title, body], index) => (
            <li key={title} className="flex gap-4">
              <span className="grid size-9 shrink-0 place-items-center rounded-full border-2 border-[#e8c08f] font-serif text-[#e8c08f]">{index + 1}</span>
              <div>
                <p className="font-medium">{title}</p>
                <p className="text-sm text-ivory/65">{body}</p>
              </div>
            </li>
          ))}
        </ol>
        {user ? (
          <button type="button" onClick={() => setStarted(true)} className={`${primaryButtonClass} w-full md:w-auto`}>
            Start your application
          </button>
        ) : (
          <Link href={`/login?next=${encodeURIComponent("/become-a-host")}`} className={`${primaryButtonClass} w-full md:w-auto`}>
            Log in to apply
          </Link>
        )}
        <p className="text-sm text-ivory/55">Takes about 10 minutes. Have a few food photos ready.</p>
      </div>
    );
  }

  function next() {
    const found = validateStep(step, draft);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  async function addPhotos(event: ChangeEvent<HTMLInputElement>) {
    const files = [...(event.target.files ?? [])].slice(0, MAX_PHOTOS - draft.photos.length);
    event.target.value = "";
    try {
      const resized = await Promise.all(files.map(resizePhoto));
      setDraft((d) => ({ ...d, photos: [...d.photos, ...resized].slice(0, MAX_PHOTOS) }));
      setErrors((e) => ({ ...e, photos: undefined }));
    } catch (error) {
      setErrors((e) => ({ ...e, photos: (error as Error).message }));
    }
  }

  function addDate() {
    if (!newDate) return setErrors((e) => ({ ...e, newDate: "Pick a date and time." }));
    const when = new Date(newDate);
    if (when.getTime() <= Date.now()) return setErrors((e) => ({ ...e, newDate: "Pick a time in the future." }));
    setDraft((d) => ({
      ...d,
      dates: [...d.dates, { startsAt: when.toISOString(), seats: Math.min(newSeats, d.maxGuests) }].sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
    }));
    setNewDate("");
    setErrors((e) => ({ ...e, newDate: undefined, dates: undefined }));
  }

  function submit() {
    const result = applyAsHost({
      host: {
        cityId: draft.cityId,
        displayName: draft.displayName.trim(),
        bio: draft.bio.trim(),
        languages: draft.languages,
        address: draft.address.trim(),
        contactPhone: draft.contactPhone.trim(),
      },
      table: {
        title: draft.title.trim(),
        cuisine: draft.cuisine.trim(),
        veg: draft.veg,
        story: draft.story.trim(),
        menu: draft.menu.trim(),
        pricePerGuest: Number(draft.pricePerGuest),
        maxGuests: draft.maxGuests,
        photos: draft.photos,
      },
      dates: draft.dates,
    });
    if ("error" in result) return setSubmitError(result.error);
    router.push("/host?submitted=1");
  }

  const city = exploreCities.find((c) => c.id === draft.cityId)!;

  return (
    <div>
      {/* Progress */}
      <div aria-hidden="true" className="flex gap-1.5">
        {STEPS.map((name, index) => (
          <span key={name} className={`h-1 flex-1 rounded-full transition-colors ${index <= step ? "bg-[#e8c08f]" : "bg-ivory/15"}`} />
        ))}
      </div>
      <p className="mt-3 text-xs tracking-[0.2em] text-terracotta-soft uppercase">
        Step {step + 1} of {STEPS.length}
      </p>
      <h2 ref={headingRef} tabIndex={-1} className="mt-1 font-serif text-3xl outline-none">
        {STEPS[step]}
      </h2>

      <div className="mt-6 space-y-6">
        {step === 0 && (
          <>
            <TextField id={f("displayName")} label="Your table's name" hint="For example, “Meenakshi's kitchen” or “The Rathore haveli table”." value={draft.displayName} onChange={set("displayName")} error={errors.displayName} maxLength={60} />
            <TextField id={f("bio")} label="About your family" hint="Who cooks, where the recipes come from, what guests can expect." multiline value={draft.bio} onChange={set("bio")} error={errors.bio} maxLength={600} />
            <fieldset>
              <legend className="text-sm text-ivory/80">Languages you speak at the table</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {LANGUAGES.map((language) => {
                  const on = draft.languages.includes(language);
                  return (
                    <button
                      key={language}
                      type="button"
                      aria-pressed={on}
                      onClick={() => set("languages")(on ? draft.languages.filter((l) => l !== language) : [...draft.languages, language])}
                      className={`rounded-full border px-4 py-2 text-sm transition-colors ${focusRing} ${on ? "border-[#e8c08f] bg-[#e8c08f]/15 text-[#e8c08f]" : "border-ivory/25 text-ivory/75"}`}
                    >
                      {language}
                    </button>
                  );
                })}
              </div>
              {errors.languages && <p className="mt-1.5 text-sm text-terracotta-soft">{errors.languages}</p>}
            </fieldset>
          </>
        )}

        {step === 1 && (
          <>
            <SelectField id={f("city")} label="City" value={draft.cityId} onChange={set("cityId")} options={exploreCities.map((c) => ({ id: c.id, name: c.name }))} />
            <TextField id={f("address")} label="Home address" hint="Private. Shared only with guests whose booking you accept." multiline value={draft.address} onChange={set("address")} error={errors.address} maxLength={300} />
            <TextField id={f("contactPhone")} label="Mobile number for guests" hint="Private, same as your address." autoComplete="tel" value={draft.contactPhone} onChange={set("contactPhone")} error={errors.contactPhone} maxLength={20} />
          </>
        )}

        {step === 2 && (
          <>
            <TextField id={f("title")} label="The meal you'll serve" hint="For example, “Kerala sadya on a banana leaf”." value={draft.title} onChange={set("title")} error={errors.title} maxLength={80} />
            <TextField id={f("cuisine")} label="Cuisine or tradition" hint="Chettinad, Kumaoni, Sindhi, Awadhi…" value={draft.cuisine} onChange={set("cuisine")} error={errors.cuisine} maxLength={40} />
            <fieldset>
              <legend className="text-sm text-ivory/80">Food</legend>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {vegOptions.map((option) => (
                  <label key={option.id} className={`flex h-12 cursor-pointer items-center justify-center rounded-full border text-sm has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ivory ${draft.veg === option.id ? "border-[#e8c08f] bg-[#e8c08f]/15 text-[#e8c08f]" : "border-ivory/25 text-ivory/75"}`}>
                    <input type="radio" name={f("veg")} value={option.id} checked={draft.veg === option.id} onChange={() => set("veg")(option.id)} className="sr-only" />
                    {option.label}
                  </label>
                ))}
              </div>
            </fieldset>
            <TextField id={f("story")} label="The story of this meal" multiline value={draft.story} onChange={set("story")} error={errors.story} maxLength={600} />
            <TextField id={f("menu")} label="Dishes you usually serve" hint="Separate with commas. It's fine if it changes with the season." multiline value={draft.menu} onChange={set("menu")} error={errors.menu} maxLength={400} />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor={f("price")} className="text-sm text-ivory/80">Price per guest (₹)</label>
                <input id={f("price")} inputMode="numeric" value={draft.pricePerGuest} onChange={(e) => set("pricePerGuest")(e.target.value.replace(/\D/g, ""))} aria-invalid={errors.pricePerGuest ? true : undefined} className={`mt-2 block w-full rounded-lg border bg-transparent px-4 py-3 text-base text-ivory focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ivory ${errors.pricePerGuest ? "border-terracotta-soft" : "border-ivory/25"}`} />
                <p className="mt-1.5 text-xs text-ivory/50">Guests pay you this at the meal.</p>
              </div>
              <div>
                <p id={f("max")} className="text-sm text-ivory/80">Most guests at once</p>
                <div role="group" aria-labelledby={f("max")} className="mt-2 flex h-[3.125rem] items-center justify-between rounded-lg border border-ivory/25 px-2">
                  <button type="button" aria-label="Fewer" onClick={() => set("maxGuests")(Math.max(1, draft.maxGuests - 1))} className={`grid size-9 place-items-center rounded-full text-xl ${focusRing}`}>−</button>
                  <span aria-live="polite">{draft.maxGuests}</span>
                  <button type="button" aria-label="More" onClick={() => set("maxGuests")(Math.min(20, draft.maxGuests + 1))} className={`grid size-9 place-items-center rounded-full text-xl ${focusRing}`}>+</button>
                </div>
              </div>
            </div>
            {errors.pricePerGuest && <p className="-mt-3 text-sm text-terracotta-soft">{errors.pricePerGuest}</p>}
          </>
        )}

        {step === 3 && (
          <>
            <p className="text-ivory/70">Real photos of your food and table, taken in daylight, work best. The first one is your cover.</p>
            <ul className="grid grid-cols-3 gap-2">
              {draft.photos.map((photo, index) => (
                <li key={index} className="relative aspect-square overflow-hidden rounded-xl bg-ivory/5">
                  <Image src={photo} alt={`Photo ${index + 1}`} fill sizes="120px" className="object-cover" unoptimized />
                  <button type="button" aria-label={`Remove photo ${index + 1}`} onClick={() => set("photos")(draft.photos.filter((_, i) => i !== index))} className={`absolute top-1 right-1 grid size-8 place-items-center rounded-full bg-pine/85 text-sm ${focusRing}`}>✕</button>
                  {index === 0 && <span className="absolute bottom-1 left-1 rounded-full bg-pine/85 px-2 py-0.5 text-[10px]">Cover</span>}
                </li>
              ))}
              {draft.photos.length < MAX_PHOTOS && (
                <li>
                  <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-ivory/30 text-sm text-ivory/70 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ivory">
                    <span aria-hidden="true" className="text-2xl">+</span>
                    Add photos
                    <input type="file" accept="image/*" multiple onChange={addPhotos} className="sr-only" />
                  </label>
                </li>
              )}
            </ul>
            {errors.photos && <p className="text-sm text-terracotta-soft">{errors.photos}</p>}
          </>
        )}

        {step === 4 && (
          <>
            <p className="text-ivory/70">Add the first dates you can host. You can add more any time from your dashboard.</p>
            <div className={`${cardClass} space-y-4`}>
              <div>
                <label htmlFor={f("date")} className="text-sm text-ivory/80">Date and time</label>
                <input id={f("date")} type="datetime-local" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="mt-2 block w-full rounded-lg border border-ivory/25 bg-transparent px-4 py-3 text-base text-ivory [color-scheme:dark] focus-visible:outline-2 focus-visible:outline-ivory" />
              </div>
              <div className="flex items-center justify-between">
                <p id={f("seats")} className="text-sm text-ivory/80">Seats</p>
                <div role="group" aria-labelledby={f("seats")} className="flex items-center gap-3">
                  <button type="button" aria-label="Fewer seats" onClick={() => setNewSeats(Math.max(1, newSeats - 1))} className={`grid size-10 place-items-center rounded-full border border-ivory/25 ${focusRing}`}>−</button>
                  <span aria-live="polite" className="w-5 text-center">{Math.min(newSeats, draft.maxGuests)}</span>
                  <button type="button" aria-label="More seats" onClick={() => setNewSeats(Math.min(draft.maxGuests, newSeats + 1))} className={`grid size-10 place-items-center rounded-full border border-ivory/25 ${focusRing}`}>+</button>
                </div>
              </div>
              {errors.newDate && <p className="text-sm text-terracotta-soft">{errors.newDate}</p>}
              <button type="button" onClick={addDate} className={secondaryButtonClass}>Add this date</button>
            </div>
            {draft.dates.length > 0 && (
              <ul className="space-y-2">
                {draft.dates.map((date, index) => (
                  <li key={date.startsAt + index} className="flex items-center justify-between rounded-xl border border-ivory/15 px-4 py-3">
                    <span>{formatWhen(date.startsAt)} · {date.seats} seats</span>
                    <button type="button" onClick={() => set("dates")(draft.dates.filter((_, i) => i !== index))} className={`rounded text-sm text-ivory/60 underline ${focusRing}`}>Remove</button>
                  </li>
                ))}
              </ul>
            )}
            {errors.dates && <p className="text-sm text-terracotta-soft">{errors.dates}</p>}
          </>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-ivory/5">
              {draft.photos[0] && <Image src={draft.photos[0]} alt="" fill sizes="600px" className="object-cover" unoptimized />}
            </div>
            <div>
              <p className="font-serif text-2xl">{draft.title}</p>
              <p className="text-sm text-ivory/60">{draft.displayName} · {city.name} · {formatPrice(Number(draft.pricePerGuest))} per guest · up to {draft.maxGuests}</p>
            </div>
            <dl className={`${cardClass} space-y-3 text-sm`}>
              {[
                ["Languages", draft.languages.join(", ")],
                ["Menu", draft.menu],
                ["Dates", draft.dates.map((d) => formatWhen(d.startsAt)).join(" · ")],
                ["Address (private)", draft.address],
              ].map(([term, value]) => (
                <div key={term}>
                  <dt className="text-ivory/55">{term}</dt>
                  <dd className="mt-0.5 text-ivory/85">{value}</dd>
                </div>
              ))}
            </dl>
            <p className="text-sm text-ivory/65">
              Once you submit, the Mehman team will review your table and arrange a short visit. It goes live after approval.
            </p>
            {submitError && <p role="alert" className="text-sm text-terracotta-soft">{submitError}</p>}
          </div>
        )}
      </div>

      <div className="mt-8 flex items-center justify-between gap-4">
        {step > 0 ? (
          <button type="button" onClick={() => setStep(step - 1)} className={`rounded px-1 py-3 text-ivory/70 ${focusRing}`}>
            ← Back
          </button>
        ) : (
          <span />
        )}
        {step < STEPS.length - 1 ? (
          <button type="button" onClick={next} className={primaryButtonClass}>Continue</button>
        ) : (
          <button type="button" onClick={submit} className={primaryButtonClass}>Submit for review</button>
        )}
      </div>

      <div className="mt-10">
        <SampleDataNote />
      </div>
    </div>
  );
}
