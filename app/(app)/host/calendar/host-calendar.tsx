"use client";

import { useId, useState } from "react";
import {
  cardClass,
  focusRing,
  PageTitle,
  SampleDataNote,
} from "@/app/_components/app-ui";
import { primaryButtonClass } from "@/app/_components/fields";
import { addSessions, removeSession, seatsLeft } from "@/lib/demo/store";
import type { DemoState, DiningTable } from "@/lib/demo/types";
import { HostGate } from "../host-shell";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const monthName = new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" });
const dayName = new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long" });
const timeName = new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit" });

const dayKey = (date: Date) =>
  `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

function Calendar({ state, table }: { state: DemoState; table: DiningTable }) {
  const uid = useId();
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selected, setSelected] = useState<Date>(() => new Date());
  const [time, setTime] = useState("13:00");
  const [seats, setSeats] = useState(table.maxGuests);
  const [repeatWeeks, setRepeatWeeks] = useState(1);
  const [message, setMessage] = useState<string | null>(null);

  const sessions = state.sessions.filter((s) => s.tableId === table.id);
  const byDay = new Map<string, typeof sessions>();
  for (const session of sessions) {
    const key = dayKey(new Date(session.startsAt));
    byDay.set(key, [...(byDay.get(key) ?? []), session]);
  }

  // Monday-first grid with blanks before the 1st.
  const lead = (cursor.getDay() + 6) % 7;
  const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(cursor.getFullYear(), cursor.getMonth(), i + 1)),
  ];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const selectedSessions = (byDay.get(dayKey(selected)) ?? []).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const selectedIsPast = selected < today;

  function add() {
    const [hours, minutes] = time.split(":").map(Number);
    const starts = Array.from({ length: repeatWeeks }, (_, week) => {
      const d = new Date(selected);
      d.setDate(d.getDate() + week * 7);
      d.setHours(hours, minutes, 0, 0);
      return d.toISOString();
    });
    const result = addSessions(table.id, starts, seats);
    if ("error" in result) return setMessage(result.error);
    setMessage(result.value === 1 ? "Date added." : `${result.value} dates added.`);
  }

  return (
    <div className="space-y-6">
      <div className={cardClass}>
        <div className="flex items-center justify-between">
          <button type="button" aria-label="Previous month" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} className={`grid size-11 place-items-center rounded-full hover:bg-ivory/10 ${focusRing}`}>‹</button>
          <h2 className="font-serif text-xl" aria-live="polite">{monthName.format(cursor)}</h2>
          <button type="button" aria-label="Next month" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} className={`grid size-11 place-items-center rounded-full hover:bg-ivory/10 ${focusRing}`}>›</button>
        </div>
        <div className="mt-3 grid grid-cols-7 text-center text-xs text-ivory/50">
          {WEEKDAYS.map((d) => <span key={d}>{d}</span>)}
        </div>
        <div className="mt-2 grid grid-cols-7 gap-1">
          {cells.map((date, index) => {
            if (!date) return <span key={`blank-${index}`} />;
            const daySessions = byDay.get(dayKey(date)) ?? [];
            const booked = daySessions.reduce((sum, s) => sum + (s.seatsTotal - seatsLeft(state, s)), 0);
            const total = daySessions.reduce((sum, s) => sum + s.seatsTotal, 0);
            const isSelected = dayKey(date) === dayKey(selected);
            const isPast = date < today;
            return (
              <button
                key={date.toISOString()}
                type="button"
                onClick={() => {
                  setSelected(date);
                  setMessage(null);
                }}
                aria-pressed={isSelected}
                aria-label={`${dayName.format(date)}${daySessions.length ? `, ${booked} of ${total} seats taken` : ""}`}
                className={`flex aspect-square flex-col items-center justify-center rounded-xl text-sm transition-colors ${focusRing} ${
                  isSelected ? "bg-[#e8c08f] text-pine" : daySessions.length ? "bg-ivory/[0.08]" : ""
                } ${isPast && !isSelected ? "text-ivory/30" : ""}`}
              >
                {date.getDate()}
                {daySessions.length > 0 && (
                  <span className={`text-[10px] leading-none ${isSelected ? "text-pine/80" : "text-[#e8c08f]"}`}>
                    {booked}/{total}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-ivory/50">Numbers show seats taken out of seats open that day.</p>
      </div>

      <section className="space-y-4">
        <h2 className="font-serif text-2xl">{dayName.format(selected)}</h2>
        {selectedSessions.length === 0 ? (
          <p className="text-ivory/65">{selectedIsPast ? "Nothing happened on this day." : "You're not hosting on this day."}</p>
        ) : (
          <ul className="space-y-2">
            {selectedSessions.map((session) => {
              const taken = session.seatsTotal - seatsLeft(state, session);
              return (
                <li key={session.id} className="flex items-center justify-between rounded-xl border border-ivory/15 px-4 py-3">
                  <span>
                    {timeName.format(new Date(session.startsAt))}
                    <span className="block text-xs text-ivory/55">{taken} of {session.seatsTotal} seats taken or requested</span>
                  </span>
                  {!selectedIsPast && (
                    <button
                      type="button"
                      onClick={() => {
                        const result = removeSession(session.id);
                        setMessage("error" in result ? result.error : "Date removed.");
                      }}
                      className={`rounded text-sm text-ivory/60 underline ${focusRing}`}
                    >
                      Remove
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {!selectedIsPast && (
          <div className={`${cardClass} space-y-4`}>
            <h3 className="font-medium">Open this day for guests</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor={`${uid}-time`} className="text-sm text-ivory/80">Time</label>
                <input id={`${uid}-time`} type="time" value={time} onChange={(e) => setTime(e.target.value)} className="mt-2 block w-full rounded-lg border border-ivory/25 bg-transparent px-3 py-2.5 text-ivory [color-scheme:dark] focus-visible:outline-2 focus-visible:outline-ivory" />
              </div>
              <div>
                <label htmlFor={`${uid}-seats`} className="text-sm text-ivory/80">Seats</label>
                <input id={`${uid}-seats`} type="number" min={1} max={table.maxGuests} value={seats} onChange={(e) => setSeats(Number(e.target.value))} className="mt-2 block w-full rounded-lg border border-ivory/25 bg-transparent px-3 py-2.5 text-ivory focus-visible:outline-2 focus-visible:outline-ivory" />
              </div>
            </div>
            <div>
              <label htmlFor={`${uid}-repeat`} className="text-sm text-ivory/80">Repeat</label>
              <select id={`${uid}-repeat`} value={repeatWeeks} onChange={(e) => setRepeatWeeks(Number(e.target.value))} className="mt-2 block w-full rounded-lg border border-ivory/25 bg-transparent px-3 py-2.5 text-ivory [color-scheme:dark] focus-visible:outline-2 focus-visible:outline-ivory">
                <option value={1}>Just this day</option>
                <option value={4}>Same day every week, for 4 weeks</option>
                <option value={8}>Same day every week, for 8 weeks</option>
                <option value={12}>Same day every week, for 12 weeks</option>
              </select>
            </div>
            <button type="button" onClick={add} className={primaryButtonClass}>Add date</button>
          </div>
        )}
        {message && <p role="status" className="text-sm text-ivory/75">{message}</p>}
      </section>
    </div>
  );
}

export function HostCalendar() {
  return (
    <HostGate>
      {({ table, state }) => (
        <div className="space-y-6">
          <PageTitle kicker="Calendar" title="When you're hosting">
            Pick a day to open it for guests. Repeat it weekly for a regular Sunday lunch.
          </PageTitle>
          {table ? <Calendar state={state} table={table} /> : <p className={`${cardClass} text-ivory/70`}>Set up your table first.</p>}
          <SampleDataNote />
        </div>
      )}
    </HostGate>
  );
}
