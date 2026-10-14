import type { Metadata } from "next";
import { SiteHeader } from "@/app/_components/site-header";
import { OurStory } from "./our-story";

export const metadata: Metadata = {
  title: "Our story · Mehman",
};

export default function OurStoryPage() {
  return (
    <div className="min-h-dvh overflow-x-clip bg-pine text-ivory">
      <SiteHeader />
      <main>
        <OurStory />
      </main>
    </div>
  );
}
