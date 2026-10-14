import type { Metadata } from "next";
import { BackLink, SiteHeader } from "@/app/_components/site-header";
import { HostOnboarding } from "./host-onboarding";

export const metadata: Metadata = {
  title: "Become a host · Mehman",
};

export default function BecomeAHostPage() {
  return (
    <div className="min-h-dvh bg-pine app-surface text-ivory">
      <SiteHeader current="host" />
      <main className="mx-auto grid max-w-6xl gap-10 px-4 pt-6 pb-16 md:grid-cols-[1fr_1fr] md:gap-20 md:px-10 md:pt-12 md:pb-24">
        <div>
          <BackLink href="/explore">Back to Explore</BackLink>
          <p className="mt-6 font-[family-name:var(--font-hand)] text-xl text-terracotta-soft md:mt-10">
            Atithi Devo Bhava
          </p>
          <h1 className="mt-1 font-serif text-4xl leading-[1.05] md:text-6xl">
            Every home has a story worth sharing.
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-ivory/80">
            Open your table to travellers who want to taste your city the way
            your family cooks it. You set the menu, the dates and the price.
          </p>
        </div>
        <div className="md:pt-24">
          <HostOnboarding />
        </div>
      </main>
    </div>
  );
}
