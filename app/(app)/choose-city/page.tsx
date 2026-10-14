import type { Metadata } from "next";
import { Suspense } from "react";
import { BackLink, SiteHeader } from "@/app/_components/site-header";
import { CityPicker } from "./city-picker";

export const metadata: Metadata = {
  title: "Choose your city · Mehman",
};

export default function ChooseCityPage() {
  return (
    <div className="min-h-dvh bg-pine text-ivory">
      <SiteHeader />
      <main className="mx-auto grid max-w-6xl gap-10 px-4 pt-6 pb-[max(3rem,env(safe-area-inset-bottom))] md:grid-cols-2 md:gap-20 md:px-10 md:pt-16 md:pb-24">
        <div>
          <BackLink href="/">Back</BackLink>
          <h1 className="mt-6 font-serif text-5xl leading-[1.05] md:mt-10 md:text-7xl">
            Where shall we meet?
          </h1>
          <p className="mt-4 text-lg text-ivory/75 md:mt-6">
            Choose the city you&rsquo;d love to dine in.
          </p>
        </div>
        <Suspense fallback={<div className="min-h-[30rem]" />}>
          <CityPicker />
        </Suspense>
      </main>
    </div>
  );
}
