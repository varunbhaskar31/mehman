import type { Metadata } from "next";
import { SiteHeader } from "@/app/_components/site-header";
import { SavedScreen } from "./saved-screen";

export const metadata: Metadata = {
  title: "Saved · Mehman",
};

export default function SavedPage() {
  return (
    <div className="min-h-dvh bg-pine text-ivory">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 pt-6 pb-16 md:px-10 md:pt-10">
        <SavedScreen />
      </main>
    </div>
  );
}
