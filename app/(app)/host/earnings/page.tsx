import type { Metadata } from "next";
import { SiteHeader } from "@/app/_components/site-header";
import { HostEarnings } from "./host-earnings";

export const metadata: Metadata = {
  title: "Earnings · Hosting · Mehman",
};

export default function Page() {
  return (
    <div className="min-h-dvh bg-pine app-surface text-ivory">
      <SiteHeader mode="host" current="earnings" />
      <main className="mx-auto max-w-2xl px-4 pt-6 pb-16 md:px-10 md:pt-10">
        <HostEarnings />
      </main>
    </div>
  );
}
