import type { Metadata } from "next";
import { BackLink, SiteHeader } from "@/app/_components/site-header";
import { HostForm } from "./host-form";

export const metadata: Metadata = {
  title: "Become a Host · Mehman",
};

export default function BecomeAHostPage() {
  return (
    <div className="min-h-dvh bg-pine text-ivory">
      <SiteHeader current="host" />
      <main className="mx-auto grid max-w-6xl gap-12 px-4 pt-6 pb-[max(4rem,env(safe-area-inset-bottom))] md:grid-cols-[1fr_1fr] md:gap-20 md:px-10 md:pt-12 md:pb-24">
        <div>
          <BackLink href="/explore">Back to Explore</BackLink>
          <h1 className="mt-6 font-serif text-5xl leading-[1.05] md:mt-10 md:text-6xl">
            Every home has a story worth sharing.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-ivory/80">
            Mehman is exploring partnerships with families who would like to
            host guests for a home-cooked meal from their region. If that sounds
            like your family, tell us a little about your kitchen.
          </p>
        </div>
        <div className="md:pt-24">
          <HostForm />
        </div>
      </main>
    </div>
  );
}
