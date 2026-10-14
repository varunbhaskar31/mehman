import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteHeader } from "@/app/_components/site-header";
import { EarlyAccess } from "./early-access";

export const metadata: Metadata = {
  title: "Get early access · Mehman",
};

export default function EarlyAccessPage() {
  return (
    <div className="min-h-dvh bg-pine text-ivory">
      <SiteHeader />
      <main className="mx-auto max-w-xl px-4 pt-6 pb-[max(4rem,env(safe-area-inset-bottom))] md:pt-12 md:pb-24">
        <Suspense fallback={<div className="min-h-[40rem]" />}>
          <EarlyAccess />
        </Suspense>
      </main>
    </div>
  );
}
