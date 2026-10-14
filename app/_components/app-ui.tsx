"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { primaryButtonClass } from "./fields";
import {
  currentUser,
  useDemoReady,
  useDemoState,
} from "@/lib/demo/store";
import type { BookingStatus, Profile, TableStatus } from "@/lib/demo/types";

export const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ivory";

export const secondaryButtonClass = `inline-flex min-h-11 items-center justify-center rounded-full border border-ivory/30 px-5 text-sm text-ivory transition-colors hover:border-ivory/60 active:scale-[0.98] ${focusRing}`;

export const cardClass = "rounded-2xl bg-ivory/[0.05] p-5";

const dateFormat = new Intl.DateTimeFormat("en-IN", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Asia/Kolkata",
});

export function formatWhen(iso: string) {
  return dateFormat.format(new Date(iso));
}

export function formatPrice(rupees: number) {
  return `₹${rupees.toLocaleString("en-IN")}`;
}

const statusStyles: Record<string, { label: string; className: string }> = {
  requested: { label: "Waiting for host", className: "bg-[#e8c08f]/15 text-[#e8c08f]" },
  accepted: { label: "Confirmed", className: "bg-[#8fc79a]/15 text-[#a9d9b1]" },
  declined: { label: "Declined", className: "bg-ivory/10 text-ivory/60" },
  cancelled: { label: "Cancelled", className: "bg-ivory/10 text-ivory/60" },
  completed: { label: "Hosted", className: "bg-ivory/10 text-ivory/75" },
  no_show: { label: "No-show", className: "bg-terracotta/20 text-terracotta-soft" },
  pending: { label: "Under review", className: "bg-[#e8c08f]/15 text-[#e8c08f]" },
  approved: { label: "Live", className: "bg-[#8fc79a]/15 text-[#a9d9b1]" },
  paused: { label: "Paused", className: "bg-ivory/10 text-ivory/70" },
  rejected: { label: "Not approved", className: "bg-terracotta/20 text-terracotta-soft" },
  draft: { label: "Draft", className: "bg-ivory/10 text-ivory/70" },
};

export function StatusChip({ status }: { status: BookingStatus | TableStatus }) {
  const style = statusStyles[status];
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${style.className}`}>
      {style.label}
    </span>
  );
}

export function SampleDataNote() {
  return (
    <p className="rounded-xl border border-dashed border-ivory/20 px-4 py-3 text-xs leading-relaxed text-ivory/55">
      Preview with sample data. Everything you do here is saved only on this
      device until Mehman&rsquo;s database is connected.
    </p>
  );
}

export function Stars({ rating, className = "" }: { rating: number; className?: string }) {
  const rounded = Math.round(rating);
  return (
    <span className={`text-[#e8c08f] ${className}`} aria-label={`${rating.toFixed(1)} out of 5 stars`}>
      {"★".repeat(rounded)}
      <span className="text-ivory/20">{"★".repeat(5 - rounded)}</span>
    </span>
  );
}

export function PageTitle({
  kicker,
  title,
  children,
}: {
  kicker?: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div>
      {kicker && (
        <p className="text-xs tracking-[0.2em] text-terracotta-soft uppercase">
          {kicker}
        </p>
      )}
      <h1 className="mt-1 font-serif text-3xl leading-tight md:text-4xl">
        {title}
      </h1>
      {children && (
        <div className="mt-2 text-base leading-relaxed text-ivory/70">
          {children}
        </div>
      )}
    </div>
  );
}

export function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className={`${cardClass} py-10 text-center`}>
      <p className="font-serif text-2xl">{title}</p>
      {children && <p className="mx-auto mt-2 max-w-sm text-sm text-ivory/65">{children}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

// Renders its children for a signed-in visitor (optionally with a role);
// anyone else is invited to log in and come straight back.
export function RequireUser({
  role,
  children,
}: {
  role?: "admin";
  children: (user: Profile) => ReactNode;
}) {
  const ready = useDemoReady();
  const user = currentUser(useDemoState());
  const pathname = usePathname();

  if (!ready) {
    return <p className="py-16 text-center text-sm text-ivory/50">Loading…</p>;
  }
  if (!user) {
    return (
      <EmptyState
        title="Log in to continue"
        action={
          <Link
            href={`/login?next=${encodeURIComponent(pathname)}`}
            className={primaryButtonClass}
          >
            Log in or sign up
          </Link>
        }
      >
        It takes a few seconds with Google, email or your phone.
      </EmptyState>
    );
  }
  if (role && user.role !== role) {
    return (
      <EmptyState
        title="This page is for the Mehman team"
        action={
          <Link href="/profile" className={secondaryButtonClass}>
            Go to your profile
          </Link>
        }
      >
        You&rsquo;re signed in as {user.fullName || user.email}.
      </EmptyState>
    );
  }
  return <>{children(user)}</>;
}
