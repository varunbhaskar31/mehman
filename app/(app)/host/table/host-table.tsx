"use client";

import Image from "next/image";
import Link from "next/link";
import { useId, useState, type ChangeEvent, type FormEvent } from "react";
import {
  cardClass,
  focusRing,
  PageTitle,
  secondaryButtonClass,
  StatusChip,
} from "@/app/_components/app-ui";
import { AreaPicker } from "@/app/_components/area-picker";
import { primaryButtonClass, TextField } from "@/app/_components/fields";
import type { LatLng } from "@/data/city-map";
import { exploreCities } from "@/data/experiences";
import { setOwnTablePaused, updateMyNeighbourhood, updateTable, type TableEdits } from "@/lib/data/store";
import type { DiningTable, Host, VegType } from "@/lib/data/types";
import { resizePhoto } from "@/lib/photos";
import { HostGate } from "../host-shell";

const MAX_PHOTOS = 8;
const vegOptions: { id: VegType; label: string }[] = [
  { id: "veg", label: "Vegetarian" },
  { id: "non_veg", label: "Non-vegetarian" },
  { id: "both", label: "Both" },
];

function Editor({ table }: { table: DiningTable }) {
  const uid = useId();
  const f = (name: string) => `${uid}-${name}`;
  const [draft, setDraft] = useState<TableEdits & { price: string }>({
    title: table.title,
    story: table.story,
    menu: table.menu,
    cuisine: table.cuisine,
    veg: table.veg,
    pricePerGuest: table.pricePerGuest,
    price: String(table.pricePerGuest),
    maxGuests: table.maxGuests,
    photos: table.photos,
  });
  const [message, setMessage] = useState<{ tone: "ok" | "warn" | "error"; text: string } | null>(null);
  const set = <K extends keyof typeof draft>(key: K) => (value: (typeof draft)[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const price = Number(draft.price);
  const live = table.status === "approved" || table.status === "paused";
  const willNeedReview =
    live && (price !== table.pricePerGuest || draft.photos.join("|") !== table.photos.join("|"));

  function movePhoto(from: number, to: number) {
    const photos = [...draft.photos];
    const [moved] = photos.splice(from, 1);
    photos.splice(to, 0, moved);
    set("photos")(photos);
  }

  async function addPhotos(event: ChangeEvent<HTMLInputElement>) {
    const files = [...(event.target.files ?? [])].slice(0, MAX_PHOTOS - draft.photos.length);
    event.target.value = "";
    try {
      const resized = await Promise.all(files.map((file) => resizePhoto(file)));
      set("photos")([...draft.photos, ...resized].slice(0, MAX_PHOTOS));
    } catch (error) {
      setMessage({ tone: "error", text: (error as Error).message });
    }
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (draft.title.trim().length < 5) return setMessage({ tone: "error", text: "Give the meal a name." });
    if (draft.story.trim().length < 30) return setMessage({ tone: "error", text: "The story needs at least 30 characters." });
    if (draft.menu.trim().length < 10) return setMessage({ tone: "error", text: "List the dishes you serve." });
    if (!Number.isInteger(price) || price < 100 || price > 50000) return setMessage({ tone: "error", text: "Price must be between ₹100 and ₹50,000." });
    if (draft.photos.length === 0) return setMessage({ tone: "error", text: "Keep at least one photo." });
    const result = await updateTable(table.id, {
      title: draft.title.trim(),
      story: draft.story.trim(),
      menu: draft.menu.trim(),
      cuisine: draft.cuisine.trim(),
      veg: draft.veg,
      pricePerGuest: price,
      maxGuests: draft.maxGuests,
      photos: draft.photos,
    });
    if ("error" in result) return setMessage({ tone: "error", text: result.error });
    // New photos are now stored URLs rather than the picked files.
    set("photos")(result.value.photos);
    setMessage(
      result.value.needsReview
        ? { tone: "warn", text: "Saved. Mehman will check the new price or photos, usually within a day." }
        : { tone: "ok", text: "Saved. Your changes are live." },
    );
  }

  return (
    <form noValidate onSubmit={save} className="space-y-6">
      <section className={`${cardClass} flex flex-wrap items-center justify-between gap-3`}>
        <div className="space-y-1">
          <StatusChip status={table.status} />
          <p className="text-sm text-ivory/60">
            {table.status === "approved" && "Guests can find and book your table."}
            {table.status === "paused" && "Hidden from guests. Your existing bookings stay."}
            {table.status === "pending" && "Waiting for Mehman's review."}
            {table.status === "rejected" && "Not approved. Edit and save to send it back for review."}
          </p>
        </div>
        <div className="flex gap-3 text-sm">
          <Link href={`/tables/${table.id}`} className={`rounded underline underline-offset-4 ${focusRing}`}>Preview</Link>
          {live && (
            <button type="button" onClick={async () => {
              const result = await setOwnTablePaused(table.id, table.status === "approved");
              if ("error" in result) setMessage({ tone: "error", text: result.error });
            }} className={`rounded underline underline-offset-4 ${focusRing}`}>
              {table.status === "approved" ? "Pause bookings" : "Resume bookings"}
            </button>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-2xl">Photos</h2>
        <p className="text-sm text-ivory/60">The first photo is your cover. Use the arrows to change the order.</p>
        <ul className="grid grid-cols-3 gap-2">
          {draft.photos.map((photo, index) => (
            <li key={photo.slice(-40) + index} className="relative aspect-square overflow-hidden rounded-xl bg-ivory/5">
              <Image src={photo} alt={`Photo ${index + 1}`} fill sizes="140px" className="object-cover" />
              {index === 0 && <span className="absolute top-1 left-1 rounded-full bg-pine/85 px-2 py-0.5 text-[10px]">Cover</span>}
              <div className="absolute inset-x-1 bottom-1 flex justify-between">
                <button type="button" disabled={index === 0} onClick={() => movePhoto(index, index - 1)} aria-label={`Move photo ${index + 1} earlier`} className={`grid size-8 place-items-center rounded-full bg-pine/85 text-sm disabled:opacity-0 ${focusRing}`}>‹</button>
                <button type="button" onClick={() => set("photos")(draft.photos.filter((_, i) => i !== index))} aria-label={`Remove photo ${index + 1}`} className={`grid size-8 place-items-center rounded-full bg-pine/85 text-xs ${focusRing}`}>✕</button>
                <button type="button" disabled={index === draft.photos.length - 1} onClick={() => movePhoto(index, index + 1)} aria-label={`Move photo ${index + 1} later`} className={`grid size-8 place-items-center rounded-full bg-pine/85 text-sm disabled:opacity-0 ${focusRing}`}>›</button>
              </div>
            </li>
          ))}
          {draft.photos.length < MAX_PHOTOS && (
            <li>
              <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-ivory/30 text-sm text-ivory/70 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ivory">
                <span aria-hidden="true" className="text-2xl">+</span>
                Add
                <input type="file" accept="image/*" multiple onChange={addPhotos} className="sr-only" />
              </label>
            </li>
          )}
        </ul>
      </section>

      <section className="space-y-6">
        <h2 className="font-serif text-2xl">The meal</h2>
        <TextField id={f("title")} label="Name of the meal" value={draft.title} onChange={set("title")} maxLength={80} />
        <TextField id={f("cuisine")} label="Cuisine or tradition" value={draft.cuisine} onChange={set("cuisine")} maxLength={40} />
        <fieldset>
          <legend className="text-sm text-ivory/80">Food</legend>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {vegOptions.map((option) => (
              <label key={option.id} className={`flex h-12 cursor-pointer items-center justify-center rounded-full border text-sm has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ivory ${draft.veg === option.id ? "border-[#e8c08f] bg-[#e8c08f]/15 text-[#e8c08f]" : "border-ivory/25 text-ivory/75"}`}>
                <input type="radio" name={f("veg")} checked={draft.veg === option.id} onChange={() => set("veg")(option.id)} className="sr-only" />
                {option.label}
              </label>
            ))}
          </div>
        </fieldset>
        <TextField id={f("story")} label="The story of this meal" multiline value={draft.story} onChange={set("story")} maxLength={600} />
        <TextField id={f("menu")} label="Dishes you usually serve" multiline value={draft.menu} onChange={set("menu")} maxLength={400} />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor={f("price")} className="text-sm text-ivory/80">Price per guest (₹)</label>
            <input id={f("price")} inputMode="numeric" value={draft.price} onChange={(e) => set("price")(e.target.value.replace(/\D/g, ""))} className="mt-2 block w-full rounded-lg border border-ivory/25 bg-transparent px-4 py-3 text-ivory focus-visible:outline-2 focus-visible:outline-ivory" />
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
      </section>

      {willNeedReview && (
        <p className="rounded-2xl bg-[#e8c08f]/12 px-5 py-4 text-sm text-[#e8c08f]">
          You changed the price or photos. Mehman will take a quick look before guests see them, and your table is hidden until then (usually within a day).
        </p>
      )}
      <div className="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] flex items-center gap-4 rounded-2xl bg-pine/95 py-3 backdrop-blur md:static md:bg-transparent">
        <button type="submit" className={primaryButtonClass}>Save changes</button>
        {message && (
          <p role="status" className={`text-sm ${message.tone === "error" ? "text-terracotta-soft" : message.tone === "warn" ? "text-[#e8c08f]" : "text-[#a9d9b1]"}`}>
            {message.text}
          </p>
        )}
      </div>
    </form>
  );
}

// The neighbourhood name and the pin guests see on Explore.
function MapSpot({ host }: { host: Host }) {
  const uid = useId();
  const city = exploreCities.find((c) => c.id === host.cityId) ?? exploreCities[0];
  const [locality, setLocality] = useState(host.locality ?? "");
  const [area, setArea] = useState<LatLng | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  async function save() {
    if (locality.trim().length < 3) return setMessage({ tone: "error", text: "Which neighbourhood are you in?" });
    if (!area) return setMessage({ tone: "error", text: "We couldn't place you on the map yet. Check the spelling, or use your current location." });
    setSaving(true);
    const result = await updateMyNeighbourhood(host.id, locality, area);
    setSaving(false);
    setMessage("error" in result ? { tone: "error", text: result.error } : { tone: "ok", text: "Saved. Guests see your new spot on Explore." });
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-serif text-2xl">Your spot on the map</h2>
        <p className="mt-1 text-sm text-ivory/60">
          {host.area ? "Guests find you on Explore by this neighbourhood." : "You're not on the Explore map yet. Add your neighbourhood so guests nearby can find you."}
        </p>
      </div>
      <TextField id={`${uid}-locality`} label="Neighbourhood" hint={`Like a part of ${city.name} guests would know. Never your exact address.`} value={locality} onChange={setLocality} maxLength={60} />
      <AreaPicker city={city} locality={locality} area={area} onChange={setArea} />
      <div className="flex flex-wrap items-center gap-4">
        <button type="button" onClick={() => void save()} disabled={saving} className={secondaryButtonClass}>
          {saving ? "Saving…" : "Save my spot"}
        </button>
        {message && (
          <p role="status" className={`text-sm ${message.tone === "error" ? "text-terracotta-soft" : "text-[#a9d9b1]"}`}>{message.text}</p>
        )}
      </div>
    </section>
  );
}

export function HostTable() {
  return (
    <HostGate>
      {({ host, table }) => (
        <div className="space-y-10">
          <div className="space-y-6">
            <PageTitle kicker="My table" title={table?.title ?? "Your table"} />
            {table ? <Editor key={table.id} table={table} /> : <p className={`${cardClass} text-ivory/70`}>No table yet.</p>}
          </div>
          <MapSpot key={host.id} host={host} />
        </div>
      )}
    </HostGate>
  );
}
