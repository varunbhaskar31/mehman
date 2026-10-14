import type { Metadata } from "next";
import { SiteHeader } from "@/app/_components/site-header";
import { HowItWorksStory } from "./how-it-works-story";

export const metadata: Metadata = {
  title: "How it works · Mehman",
};

export default function HowItWorksPage() {
  return (
    <div className="min-h-dvh overflow-x-clip bg-pine text-ivory">
      <SiteHeader />
      <main>
        <HowItWorksStory />
      </main>
    </div>
  );
}
