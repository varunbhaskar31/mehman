import type { Metadata } from "next";
import { SiteHeader } from "@/app/_components/site-header";
import { HostRequests } from "./host-requests";

export const metadata: Metadata = {
  title: "Requests · Hosting · Mehman",
};

export default function Page() {
  return (
    <div className="min-h-dvh bg-pine app-surface text-ivory">
      <SiteHeader mode="host" current="requests" />
      <main className="mx-auto max-w-2xl px-4 pt-6 pb-16 md:px-10 md:pt-10">
        <HostRequests />
      </main>
    </div>
  );
}
