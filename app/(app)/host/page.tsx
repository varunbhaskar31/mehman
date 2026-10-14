import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteHeader } from "@/app/_components/site-header";
import { HostDashboard } from "./host-dashboard";

export const metadata: Metadata = {
  title: "Hosting · Mehman",
};

export default function HostPage() {
  return (
    <div className="min-h-dvh bg-pine text-ivory">
      <SiteHeader current="host" />
      <main className="mx-auto max-w-2xl px-4 pt-6 pb-16 md:px-10 md:pt-10">
        <Suspense>
          <HostDashboard />
        </Suspense>
      </main>
    </div>
  );
}
