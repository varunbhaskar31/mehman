import type { Metadata } from "next";
import { SiteHeader } from "@/app/_components/site-header";
import { AdminBookings } from "./admin-bookings";

export const metadata: Metadata = {
  title: "Bookings · Mehman team",
};

export default function Page() {
  return (
    <div className="min-h-dvh bg-pine app-surface text-ivory">
      <SiteHeader mode="admin" current="admin-bookings" />
      <main className="mx-auto max-w-3xl px-4 pt-6 pb-16 md:px-10 md:pt-10">
        <AdminBookings />
      </main>
    </div>
  );
}
