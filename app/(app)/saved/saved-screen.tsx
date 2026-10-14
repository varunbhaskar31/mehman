"use client";

import Link from "next/link";
import {
  EmptyState,
  formatWhen,
  PageTitle,
  RequireUser,
  SampleDataNote,
} from "@/app/_components/app-ui";
import { primaryButtonClass } from "@/app/_components/fields";
import { TableCard } from "@/app/_components/table-card";
import { findExploreCity } from "@/data/experiences";
import { mySavedTables, seatsLeft, upcomingSessions, useDemoState } from "@/lib/demo/store";

export function SavedScreen() {
  const state = useDemoState();

  return (
    <RequireUser>
      {() => {
        const tables = mySavedTables(state);
        return (
          <div className="space-y-6">
            <PageTitle kicker="Saved" title="Tables you'd love to sit at">
              Tap ♡ on any family table to keep it here, then come back to book.
            </PageTitle>
            {tables.length === 0 ? (
              <EmptyState title="Nothing saved yet" action={<Link href="/experiences" className={primaryButtonClass}>Browse experiences</Link>}>
                Save the meals that catch your eye while you explore.
              </EmptyState>
            ) : (
              <ul className="grid gap-6 md:grid-cols-3 md:gap-x-6 md:gap-y-10 lg:grid-cols-4">
                {tables.map((table) => {
                  const host = state.hosts.find((h) => h.id === table.hostId);
                  const open = table.status === "approved";
                  const next = upcomingSessions(state, table.id).find((s) => seatsLeft(state, s) > 0);
                  return (
                    <TableCard
                      key={table.id}
                      table={table}
                      host={host}
                      kicker={findExploreCity(host?.cityId)?.name}
                      footnote={!open ? "Not taking bookings right now" : next ? `Next: ${formatWhen(next.startsAt)} · Book now` : "No open dates yet"}
                      highlight={open && Boolean(next)}
                      dimmed={!open}
                      heading="h2"
                    />
                  );
                })}
              </ul>
            )}
            <SampleDataNote />
          </div>
        );
      }}
    </RequireUser>
  );
}
