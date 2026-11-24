"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { primaryButtonClass } from "./fields";
import { cardClass, focusRing, formatPrice, formatWhen } from "./app-ui";
import { CLOSE_BEFORE_MS, loadBookingPayment, setBookingStatus } from "@/lib/data/store";
import type { Booking, DiningSession, DepositStatus } from "@/lib/data/types";

const HOUR = 60 * 60 * 1000;

// When the host must answer by (6 hours, or when requests close).
export function respondBy(booking: Booking, session: DiningSession) {
  return new Date(
    Math.min(new Date(booking.createdAt).getTime() + 6 * HOUR, new Date(session.startsAt).getTime() - CLOSE_BEFORE_MS),
  );
}

// When the guest must pay the deposit by (12 hours after acceptance, or
// when requests close).
export function payBy(booking: Booking, session: DiningSession) {
  const accepted = new Date(booking.acceptedAt ?? booking.createdAt).getTime();
  return new Date(Math.min(accepted + 12 * HOUR, new Date(session.startsAt).getTime() - CLOSE_BEFORE_MS));
}

export function formatDeadline(date: Date) {
  const left = date.getTime() - Date.now();
  if (left <= 0) return "any moment now";
  const hours = Math.floor(left / HOUR);
  const minutes = Math.round((left % HOUR) / 60000);
  const span = hours > 0 ? `${hours}h ${minutes}m` : `${minutes} min`;
  return `${span} (by ${formatWhen(date.toISOString())})`;
}

// The UPI deep link the deposit is paid with. Mehman never touches the
// money: it goes straight to the host's UPI ID.
export function upiLink(upiId: string, payee: string, amount: number) {
  return `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payee)}&am=${amount}&cu=INR`;
}

const depositWords: Record<DepositStatus, string> = {
  none: "not paid",
  claimed: "sent, waiting for host",
  received: "paid",
  refund_due: "to be refunded",
  refunded: "refunded",
  kept: "kept by host",
};

// Total, deposit and what's left to pay at the meal.
export function MoneySummary({ booking }: { booking: Booking }) {
  const total = booking.partySize * booking.pricePerGuest;
  const depositPaid = booking.depositStatus === "received" || booking.depositStatus === "kept";
  const balance = depositPaid ? total - booking.depositInr : total;
  if (booking.depositInr === 0) {
    return (
      <p className="text-ivory/80">
        <span className="text-ivory/55">Pay at the meal · </span>
        {formatPrice(total)}
      </p>
    );
  }
  return (
    <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 rounded-xl bg-ivory/[0.04] px-4 py-3">
      <dt className="text-ivory/60">
        Total · {booking.partySize} × {formatPrice(booking.pricePerGuest)}
      </dt>
      <dd className="text-right">{formatPrice(total)}</dd>
      <dt className="text-ivory/60">Deposit ({depositWords[booking.depositStatus]})</dt>
      <dd className="text-right">−{formatPrice(booking.depositInr)}</dd>
      <dt className="font-medium">Balance due at the meal</dt>
      <dd className="text-right font-medium">{formatPrice(balance)}</dd>
    </dl>
  );
}

// The guest's deposit step: UPI button, QR for paying from another phone,
// and "I've paid".
export function DepositPanel({ booking, session }: { booking: Booking; session: DiningSession }) {
  const [payment, setPayment] = useState<{ upiId: string; payeeName: string; amount: number } | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let live = true;
    void loadBookingPayment(booking.id).then(async (p) => {
      if (!live) return;
      setPayment(p);
      if (p) {
        const url = await QRCode.toDataURL(upiLink(p.upiId, p.payeeName, p.amount), { margin: 1, width: 360 });
        if (live) setQr(url);
      }
    });
    return () => {
      live = false;
    };
  }, [booking.id]);

  if (!payment) {
    return <p className="text-ivory/60">Loading payment details…</p>;
  }
  const link = upiLink(payment.upiId, payment.payeeName, payment.amount);

  return (
    <div className={`${cardClass} space-y-4 bg-terracotta/10`}>
      <div>
        <p className="font-serif text-2xl">Pay the {formatPrice(payment.amount)} deposit</p>
        <p className="mt-1 text-ivory/70">
          {payment.payeeName} accepted. Pay the deposit straight to them by UPI within{" "}
          {formatDeadline(payBy(booking, session))} to confirm your seats. You pay the rest at the meal.
        </p>
      </div>
      <a href={link} className={`${primaryButtonClass} w-full`}>
        Pay with UPI
      </a>
      <div className="flex flex-col items-center gap-2 sm:flex-row sm:items-start sm:gap-4">
        {qr ? (
          // eslint-disable-next-line @next/next/no-img-element -- a generated data URL
          <img src={qr} alt={`UPI QR code to pay ${payment.payeeName} ${formatPrice(payment.amount)}`} width={180} height={180} className="rounded-xl bg-white p-2" />
        ) : (
          <div className="size-[180px] rounded-xl bg-ivory/10" aria-hidden="true" />
        )}
        <p className="text-sm text-ivory/65">
          On a computer? Scan this with any UPI app.
          <br />
          UPI ID: <span className="font-mono text-ivory">{payment.upiId}</span>
          <br />
          Mehman never handles your money.
        </p>
      </div>
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          const result = await setBookingStatus(booking.id, "deposit_claimed");
          setBusy(false);
          setError("error" in result ? result.error : null);
        }}
        className={`inline-flex min-h-11 w-full items-center justify-center rounded-full border border-ivory/40 px-5 text-ivory disabled:opacity-60 ${focusRing}`}
      >
        {busy ? "Saving…" : "I've paid"}
      </button>
      {error && <p role="alert" className="text-terracotta-soft">{error}</p>}
    </div>
  );
}

// Shown once the team has made the WhatsApp group.
export function WhatsappNotice({ booking, other }: { booking: Booking; other: "host" | "guest" }) {
  if (booking.status !== "confirmed") return null;
  return booking.whatsappGroupAt ? (
    <p className="rounded-xl bg-[#25d366]/15 px-4 py-3 text-[#b8f0cc]">
      <span className="font-medium">Check WhatsApp for your group.</span> The Mehman team has added you and your {other}; plan
      the details there.
    </p>
  ) : (
    <p className="rounded-xl bg-ivory/[0.05] px-4 py-3 text-ivory/70">
      The Mehman team will add you to a WhatsApp group with your {other} shortly.
    </p>
  );
}
