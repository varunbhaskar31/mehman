import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import indiaPlatter from "@/assets/india-platter.png";
import { SiteHeader } from "@/app/_components/site-header";
import { ExploreScreen } from "./explore-screen";

export const metadata: Metadata = {
  title: "Explore · Mehman",
};

export default function ExplorePage() {
  return (
    <div className="min-h-dvh bg-pine text-ivory">
      <SiteHeader current="explore" />
      <main>
        <h1 className="sr-only">Explore India&rsquo;s food traditions</h1>
        <div className="mx-auto mt-2 max-w-[min(760px,calc((100dvh-13rem)*1.03))] md:mt-0 md:max-w-[min(760px,calc((100dvh-15rem)*1.03))]">
          <Image
            src={indiaPlatter}
            alt="An India-shaped brass platter filled with regional dishes, from rice and curries to dosa, idli and momos, on a dark green table."
            preload
            sizes="(min-width: 760px) 760px, 100vw"
            className="platter-fade h-auto w-full"
          />
        </div>
        <Suspense fallback={<div className="min-h-[40rem]" />}>
          <ExploreScreen />
        </Suspense>
      </main>
    </div>
  );
}
