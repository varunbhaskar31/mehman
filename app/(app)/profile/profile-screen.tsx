"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent, type ReactNode } from "react";
import {
  cardClass,
  focusRing,
  RequireUser,
  SampleDataNote,
  secondaryButtonClass,
  StatusChip,
} from "@/app/_components/app-ui";
import { primaryButtonClass, TextField } from "@/app/_components/fields";
import { MehmanLogo } from "@/app/_components/mehman-logo";
import { navIcons } from "@/app/_components/nav-icons";
import {
  currentUser,
  homeFor,
  hostForUser,
  resetDemo,
  signOut,
  switchUser,
  updateProfile,
  useDemoReady,
  useDemoState,
} from "@/lib/demo/store";
import type { Profile } from "@/lib/demo/types";

type Row = { href: string; label: string; detail?: string; icon?: string };

function RowList({ title, rows }: { title?: string; rows: Row[] }) {
  return (
    <section>
      {title && <h2 className="mb-2 text-sm tracking-[0.15em] text-ivory/55 uppercase md:mb-4">{title}</h2>}
      {/* Phones: a settings list. Wider screens: Airbnb's account tiles. */}
      <ul className={`${cardClass} divide-y divide-ivory/10 p-0 md:grid md:grid-cols-3 md:p-0 md:gap-4 md:divide-y-0 md:bg-transparent`}>
        {rows.map((row) => (
          <li key={row.href + row.label}>
            <Link href={row.href} className={`flex items-center justify-between gap-3 rounded-2xl px-5 py-4 md:h-full md:flex-col md:items-start md:justify-start md:gap-6 md:p-5 md:shadow-[0_4px_16px_rgb(0_0_0/0.35)] md:ring-1 md:ring-ivory/10 md:transition-colors md:hover:bg-ivory/[0.05] ${focusRing}`}>
              {row.icon && <span className="hidden text-[#e8c08f] md:block">{navIcons[row.icon]}</span>}
              <span>
                <span className="block md:font-medium">{row.label}</span>
                {row.detail && <span className="block text-sm text-ivory/55 md:mt-1">{row.detail}</span>}
              </span>
              <span aria-hidden="true" className="text-ivory/45 md:hidden">›</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

const infoRows: Row[] = [
  { href: "/how-it-works", label: "How Mehman works", icon: "explore" },
  { href: "/our-story", label: "Our story", icon: "experiences" },
  { href: "mailto:hello@mehman.in", label: "Get help", detail: "hello@mehman.in", icon: "requests" },
];

function PersonalInfo({ user }: { user: Profile }) {
  const uid = useId();
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState(user.fullName);
  const [phone, setPhone] = useState(user.phone);
  const [message, setMessage] = useState<string | null>(null);

  function save(event: FormEvent) {
    event.preventDefault();
    if (fullName.trim().length < 2) return setMessage("Please enter your name.");
    const result = updateProfile({ fullName, phone });
    if ("error" in result) return setMessage(result.error);
    setMessage(null);
    setOpen(false);
  }

  if (!open) {
    return (
      <section className={`${cardClass} flex items-center justify-between gap-3`}>
        <div className="min-w-0">
          <p className="text-sm text-ivory/55">Personal info</p>
          <p className="truncate">{user.fullName || "Add your name"}</p>
          <p className="truncate text-sm text-ivory/60">{[user.email, user.phone].filter(Boolean).join(" · ")}</p>
        </div>
        <button type="button" onClick={() => setOpen(true)} className={secondaryButtonClass}>Edit</button>
      </section>
    );
  }

  return (
    <form noValidate onSubmit={save} className={`${cardClass} space-y-5`}>
      <h2 className="font-serif text-2xl">Personal info</h2>
      <TextField id={`${uid}-name`} label="Name" autoComplete="name" value={fullName} onChange={setFullName} maxLength={80} />
      <TextField id={`${uid}-phone`} label="Mobile number" autoComplete="tel" value={phone} onChange={setPhone} maxLength={20} hint="Shared with a host only after they accept your booking." />
      {message && <p role="alert" className="text-sm text-terracotta-soft">{message}</p>}
      <div className="flex items-center gap-3">
        <button type="submit" className={primaryButtonClass}>Save</button>
        <button type="button" onClick={() => setOpen(false)} className={`rounded px-2 py-2 text-ivory/70 ${focusRing}`}>Cancel</button>
      </div>
    </form>
  );
}

function PreviewTools({ user }: { user: Profile }) {
  const state = useDemoState();
  const router = useRouter();
  const describe = (profile: Profile) => {
    if (profile.role === "admin") return "Mehman team (approves hosts)";
    const host = hostForUser(state, profile.id);
    return host ? `Host · ${host.displayName}` : "Traveller";
  };

  return (
    <section className={`${cardClass} border border-dashed border-ivory/20 bg-transparent`}>
      <h2 className="font-serif text-2xl">Preview tools</h2>
      <p className="mt-1 text-sm text-ivory/60">
        Try every side of Mehman on one phone. Switch to a host or the Mehman team, then switch back.
      </p>
      <ul className="mt-4 divide-y divide-ivory/10">
        {state.profiles.map((profile) => (
          <li key={profile.id} className="flex items-center justify-between gap-3 py-3">
            <div className="min-w-0">
              <p className="truncate">{profile.fullName || profile.email || profile.phone}</p>
              <p className="truncate text-xs text-ivory/55">{describe(profile)}</p>
            </div>
            {profile.id === user.id ? (
              <span className="text-xs text-[#e8c08f]">You now</span>
            ) : (
              <button
                type="button"
                onClick={() => {
                  // Land where that person starts: hosting mode, the team
                  // console, or Explore.
                  switchUser(profile.id);
                  router.push(homeFor(state, profile.id));
                }}
                className={secondaryButtonClass}
              >
                Switch
              </button>
            )}
          </li>
        ))}
      </ul>
      <button type="button" onClick={resetDemo} className={`mt-4 rounded text-sm text-terracotta-soft underline underline-offset-4 ${focusRing}`}>
        Reset all sample data
      </button>
    </section>
  );
}

function HostingCard({ user }: { user: Profile }) {
  const state = useDemoState();
  const host = hostForUser(state, user.id);
  const table = host && state.tables.find((t) => t.hostId === host.id);

  let body: ReactNode;
  if (user.role === "admin") {
    body = (
      <>
        <p className="font-serif text-2xl">Mehman team</p>
        <p className="mt-1 text-sm text-ivory/70">Review new hosts, look after live tables and follow every booking.</p>
        <Link href="/admin" className={`${primaryButtonClass} mt-5 w-full`}>Open team console</Link>
      </>
    );
  } else if (host) {
    body = (
      <>
        <div className="flex items-center gap-2">
          <p className="font-serif text-2xl">{host.displayName}</p>
          {table && <StatusChip status={table.status} />}
        </div>
        <p className="mt-1 text-sm text-ivory/70">Requests, calendar, your table and earnings.</p>
        <Link href="/host" className={`${primaryButtonClass} mt-5 w-full`}>Switch to hosting</Link>
      </>
    );
  } else {
    body = (
      <>
        <p className="font-serif text-2xl">Open your table to travellers</p>
        <p className="mt-1 text-sm text-ivory/70">Share your family&rsquo;s food and stories. You set the menu, the dates and the price.</p>
        <Link href="/become-a-host" className={`${primaryButtonClass} mt-5 w-full`}>Become a host</Link>
      </>
    );
  }

  return (
    <section className="flex gap-4 rounded-2xl bg-gradient-to-br from-[#e8c08f]/20 to-terracotta/10 p-5">
      <MehmanLogo className="h-12 w-auto shrink-0" />
      <div className="min-w-0 flex-1">{body}</div>
    </section>
  );
}

export function ProfileScreen() {
  const state = useDemoState();
  const ready = useDemoReady();
  const router = useRouter();
  const user = currentUser(state);

  // Signed out: an invitation to log in, plus the info pages.
  if (ready && !user) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-xs tracking-[0.2em] text-terracotta-soft uppercase">Profile</p>
          <h1 className="mt-1 font-serif text-3xl leading-tight">Log in to request seats and follow your trips</h1>
        </div>
        <Link href="/login?next=/profile" className={`${primaryButtonClass} w-full`}>Log in or sign up</Link>
        <RowList rows={[{ href: "/become-a-host", label: "Become a host", detail: "Open your table to travellers" }, ...infoRows]} />
        <SampleDataNote />
      </div>
    );
  }

  return (
    <RequireUser>
      {(me) => (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <span className="grid size-16 shrink-0 place-items-center rounded-full bg-[#e8c08f] font-serif text-2xl text-pine">
              {(me.fullName || me.email || "?").slice(0, 1).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="text-xs tracking-[0.2em] text-terracotta-soft uppercase">Profile</p>
              <h1 className="truncate font-serif text-3xl md:text-4xl">{me.fullName || "Welcome"}</h1>
              <p className="hidden truncate text-ivory/60 md:block">{[me.email, me.phone].filter(Boolean).join(" · ")}</p>
            </div>
          </div>

          <RowList
            rows={[
              { href: "/bookings", label: "My bookings", detail: "Seats you've requested and meals you've had", icon: "trips" },
              { href: "/saved", label: "Saved", detail: "Tables you bookmarked", icon: "saved" },
              { href: "/updates", label: "Updates", detail: "Replies from hosts and reminders", icon: "today" },
            ]}
          />
          <div className="space-y-6 md:grid md:grid-cols-2 md:items-start md:gap-6 md:space-y-0">
            <HostingCard user={me} />
            <PersonalInfo key={me.id} user={me} />
          </div>
          <RowList title="About Mehman" rows={infoRows} />
          <button
            type="button"
            onClick={() => {
              signOut();
              router.replace("/explore");
            }}
            className={secondaryButtonClass}
          >
            Log out
          </button>
          <PreviewTools user={me} />
          <SampleDataNote />
        </div>
      )}
    </RequireUser>
  );
}
