"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent } from "react";
import {
  cardClass,
  focusRing,
  PageTitle,
  RequireUser,
  SampleDataNote,
  secondaryButtonClass,
} from "@/app/_components/app-ui";
import { primaryButtonClass, TextField } from "@/app/_components/fields";
import {
  hostForUser,
  resetDemo,
  signOut,
  switchUser,
  updateProfile,
  useDemoState,
} from "@/lib/demo/store";
import type { Profile } from "@/lib/demo/types";

function ProfileForm({ user }: { user: Profile }) {
  const uid = useId();
  const [fullName, setFullName] = useState(user.fullName);
  const [phone, setPhone] = useState(user.phone);
  const [message, setMessage] = useState<string | null>(null);

  function save(event: FormEvent) {
    event.preventDefault();
    if (fullName.trim().length < 2) return setMessage("Please enter your name.");
    const result = updateProfile({ fullName, phone });
    setMessage("error" in result ? result.error : "Saved.");
  }

  return (
    <form noValidate onSubmit={save} className={`${cardClass} space-y-5`}>
      <h2 className="font-serif text-2xl">Your details</h2>
      <TextField id={`${uid}-name`} label="Name" autoComplete="name" value={fullName} onChange={setFullName} maxLength={80} />
      <TextField id={`${uid}-phone`} label="Mobile number" autoComplete="tel" value={phone} onChange={setPhone} maxLength={20} hint="Shared with a host only after they accept your booking." />
      {user.email && <p className="text-sm text-ivory/60">Signed in as {user.email}</p>}
      <div className="flex items-center gap-4">
        <button type="submit" className={primaryButtonClass}>
          Save
        </button>
        <p aria-live="polite" className="text-sm text-ivory/70">
          {message}
        </p>
      </div>
    </form>
  );
}

function DemoTools({ user }: { user: Profile }) {
  const state = useDemoState();
  const router = useRouter();
  const describe = (profile: Profile) =>
    profile.role === "admin"
      ? "Mehman team (approves hosts)"
      : hostForUser(state, profile.id)
        ? `Host: ${hostForUser(state, profile.id)!.displayName}`
        : "Guest";

  return (
    <section className={`${cardClass} border border-dashed border-ivory/20 bg-transparent`}>
      <h2 className="font-serif text-2xl">Preview tools</h2>
      <p className="mt-1 text-sm text-ivory/60">
        Try every side of Mehman on one phone: switch to a host or the Mehman
        team, then switch back.
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
                  switchUser(profile.id);
                  router.refresh();
                }}
                className={secondaryButtonClass}
              >
                Switch
              </button>
            )}
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={resetDemo}
        className={`mt-4 rounded text-sm text-terracotta-soft underline underline-offset-4 ${focusRing}`}
      >
        Reset all sample data
      </button>
    </section>
  );
}

export function AccountScreen() {
  const state = useDemoState();
  const router = useRouter();

  return (
    <RequireUser>
      {(user) => {
        const host = hostForUser(state, user.id);
        const links = [
          { href: "/trips", label: "My trips", detail: "Seats you've requested and booked" },
          host
            ? { href: "/host", label: "Hosting dashboard", detail: host.displayName }
            : { href: "/become-a-host", label: "Become a host", detail: "Open your table to travellers" },
          ...(user.role === "admin"
            ? [{ href: "/admin", label: "Review hosts", detail: "Approve new hosts and tables" }]
            : []),
        ];
        return (
          <div className="space-y-6">
            <PageTitle kicker="Your account" title={`Namaste, ${user.fullName.split(" ")[0] || "there"}`} />
            <ul className={`${cardClass} divide-y divide-ivory/10 p-0`}>
              {links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={`flex items-center justify-between gap-3 rounded-2xl px-5 py-4 ${focusRing}`}>
                    <span>
                      <span className="block">{link.label}</span>
                      <span className="block text-sm text-ivory/55">{link.detail}</span>
                    </span>
                    <span aria-hidden="true" className="text-ivory/50">→</span>
                  </Link>
                </li>
              ))}
            </ul>
            <ProfileForm key={user.id} user={user} />
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
            <DemoTools user={user} />
            <SampleDataNote />
          </div>
        );
      }}
    </RequireUser>
  );
}
