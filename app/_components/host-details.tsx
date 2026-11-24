"use client";

import Image from "next/image";
import { useId, useState, type ChangeEvent } from "react";
import { cardClass, focusRing, secondaryButtonClass } from "./app-ui";
import { TextField } from "./fields";
import {
  updateMyUpi,
  updateMyVenue,
  uploadVerification,
  type DocumentKind,
  type VenueDetails,
} from "@/lib/data/store";
import { DIET_TAGS, dietLabel, type DietTag, type Host } from "@/lib/data/types";
import { resizePhoto } from "@/lib/photos";

export const UPI_PATTERN = /^[A-Za-z0-9._-]{2,255}@[A-Za-z][A-Za-z0-9.]{1,63}$/;

type Message = { tone: "ok" | "error"; text: string } | null;

function Status({ message }: { message: Message }) {
  if (!message) return null;
  return (
    <p role="status" className={`text-sm ${message.tone === "error" ? "text-terracotta-soft" : "text-[#a9d9b1]"}`}>
      {message.text}
    </p>
  );
}

// Veg, non-veg, Jain, vegan, halal, gluten-free: as many as apply.
export function DietTagPicker({ value, onChange }: { value: DietTag[]; onChange: (tags: DietTag[]) => void }) {
  return (
    <fieldset>
      <legend className="text-sm text-ivory/80">Diets you cater for</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {DIET_TAGS.map((tag) => {
          const on = value.includes(tag);
          return (
            <label
              key={tag}
              className={`flex min-h-11 cursor-pointer items-center rounded-full border px-4 text-sm has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ivory ${on ? "border-[#e8c08f] bg-[#e8c08f]/15 text-[#e8c08f]" : "border-ivory/25 text-ivory/75"}`}
            >
              <input
                type="checkbox"
                checked={on}
                onChange={() => onChange(on ? value.filter((t) => t !== tag) : [...value, tag])}
                className="sr-only"
              />
              {dietLabel[tag]}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

// Where guests send the ₹500 deposit. Private: a guest sees it only after
// the host accepts their request.
export function UpiForm({ host }: { host: Host }) {
  const uid = useId();
  const [upi, setUpi] = useState(host.upiId);
  const [message, setMessage] = useState<Message>(null);
  return (
    <section id="upi" className={`${cardClass} scroll-mt-24 space-y-4`}>
      <div>
        <h2 className="font-serif text-2xl">Your UPI ID</h2>
        <p className="mt-1 text-sm text-ivory/60">
          Guests pay a ₹500 deposit straight to you after you accept them, and the rest at the meal. Only guests you&rsquo;ve
          accepted see it. Mehman never handles the money.
        </p>
      </div>
      <TextField id={`${uid}-upi`} label="UPI ID" hint="Like yourname@okhdfcbank" value={upi} onChange={setUpi} maxLength={120} />
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={async () => {
            if (!UPI_PATTERN.test(upi.trim())) {
              return setMessage({ tone: "error", text: "That doesn't look like a UPI ID. It looks like name@bank." });
            }
            const result = await updateMyUpi(host.id, upi);
            setMessage("error" in result ? { tone: "error", text: result.error } : { tone: "ok", text: "Saved." });
          }}
          className={secondaryButtonClass}
        >
          Save UPI ID
        </button>
        <Status message={message} />
      </div>
    </section>
  );
}

const MAX_HOME_PHOTOS = 6;

export function VenueFields({
  value,
  onChange,
}: {
  value: VenueDetails;
  onChange: (venue: VenueDetails) => void;
}) {
  const uid = useId();
  const set = (key: keyof VenueDetails) => (v: string) => onChange({ ...value, [key]: v });

  async function addPhotos(event: ChangeEvent<HTMLInputElement>) {
    const files = [...(event.target.files ?? [])].slice(0, MAX_HOME_PHOTOS - value.homePhotos.length);
    event.target.value = "";
    const resized = await Promise.all(files.map((file) => resizePhoto(file)));
    onChange({ ...value, homePhotos: [...value.homePhotos, ...resized].slice(0, MAX_HOME_PHOTOS) });
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField id={`${uid}-floor`} label="Floor and access" hint="Like: 3rd floor, lift available" value={value.venueFloor} onChange={set("venueFloor")} maxLength={80} />
        <TextField id={`${uid}-parking`} label="Parking" hint="Like: street parking, or one car in the compound" value={value.venueParking} onChange={set("venueParking")} maxLength={80} />
        <TextField id={`${uid}-pets`} label="Pets at home" hint="Like: a friendly cat, or none" value={value.venuePets} onChange={set("venuePets")} maxLength={80} />
        <TextField id={`${uid}-seating`} label="Seating" hint="Like: dining table for 6, or floor seating" value={value.venueSeating} onChange={set("venueSeating")} maxLength={80} />
      </div>
      <TextField id={`${uid}-rules`} label="House rules" multiline hint="Like: shoes off at the door, no alcohol" value={value.houseRules} onChange={set("houseRules")} maxLength={400} />
      <div>
        <p className="text-sm text-ivory/80">Photos of your home</p>
        <p className="text-sm text-ivory/50">The room you&rsquo;ll eat in, the table, the view. Kept apart from your meal photos.</p>
        <ul className="mt-2 grid grid-cols-3 gap-2">
          {value.homePhotos.map((photo, index) => (
            <li key={photo.slice(-40) + index} className="relative aspect-square overflow-hidden rounded-xl bg-ivory/5">
              <Image src={photo} alt={`Home photo ${index + 1}`} fill sizes="140px" className="object-cover" />
              <button
                type="button"
                onClick={() => onChange({ ...value, homePhotos: value.homePhotos.filter((_, i) => i !== index) })}
                aria-label={`Remove home photo ${index + 1}`}
                className={`absolute right-1 bottom-1 grid size-8 place-items-center rounded-full bg-pine/85 text-xs ${focusRing}`}
              >
                ✕
              </button>
            </li>
          ))}
          {value.homePhotos.length < MAX_HOME_PHOTOS && (
            <li>
              <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-ivory/30 text-sm text-ivory/70 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ivory">
                <span aria-hidden="true" className="text-2xl">+</span>
                Add
                <input type="file" accept="image/*" multiple onChange={addPhotos} className="sr-only" />
              </label>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

export function venueOf(host: Host): VenueDetails {
  return {
    venueFloor: host.venueFloor,
    venueParking: host.venueParking,
    venuePets: host.venuePets,
    venueSeating: host.venueSeating,
    houseRules: host.houseRules,
    homePhotos: host.homePhotos,
  };
}

export function VenueForm({ host }: { host: Host }) {
  const [venue, setVenue] = useState<VenueDetails>(venueOf(host));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<Message>(null);
  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-serif text-2xl">Your home</h2>
        <p className="mt-1 text-sm text-ivory/60">Guests see this on your table&rsquo;s page, so they know what to expect.</p>
      </div>
      <VenueFields value={venue} onChange={setVenue} />
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          disabled={saving}
          onClick={async () => {
            setSaving(true);
            const result = await updateMyVenue(host.id, venue);
            setSaving(false);
            if ("error" in result) return setMessage({ tone: "error", text: result.error });
            setMessage({ tone: "ok", text: "Saved." });
          }}
          className={secondaryButtonClass}
        >
          {saving ? "Saving…" : "Save home details"}
        </button>
        <Status message={message} />
      </div>
    </section>
  );
}

const documentKinds: { kind: DocumentKind; label: string; hint: string }[] = [
  { kind: "id", label: "Photo ID", hint: "Aadhaar, PAN, passport or driving licence" },
  { kind: "fssai", label: "FSSAI registration", hint: "If you have one" },
  { kind: "kitchen", label: "Kitchen photo", hint: "Where you cook" },
];

// Optional; only the Mehman team can open these files.
export function VerificationUploads({ host }: { host: Host }) {
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState<Message>(null);
  return (
    <section className={`${cardClass} space-y-4`}>
      <div>
        <h2 className="font-serif text-2xl">Verification (optional)</h2>
        <p className="mt-1 text-sm text-ivory/60">
          These help the Mehman team approve you faster. They&rsquo;re stored privately and only the team can open them.
          Photos or PDFs, up to 5 MB.
        </p>
      </div>
      <ul className="space-y-3">
        {documentKinds.map((d) => (
          <li key={d.kind} className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p>{d.label}</p>
              <p className="text-sm text-ivory/50">{d.hint}</p>
            </div>
            <label className={`${secondaryButtonClass} cursor-pointer has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ivory`}>
              {done[d.kind] ? "Uploaded ✓" : "Upload"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                className="sr-only"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  if (!file) return;
                  const result = await uploadVerification(host.id, d.kind, file);
                  if ("error" in result) return setMessage({ tone: "error", text: result.error });
                  setDone((x) => ({ ...x, [d.kind]: true }));
                  setMessage({ tone: "ok", text: `${d.label} uploaded.` });
                }}
              />
            </label>
          </li>
        ))}
      </ul>
      <Status message={message} />
    </section>
  );
}
