import type { Metadata } from "next";
import { SiteHeader } from "@/app/_components/site-header";
import { UpdatesScreen } from "../../updates/updates-screen";

export const metadata: Metadata = {
  title: "Updates · Hosting · Mehman",
};

// The same updates, without leaving hosting mode.
export default function Page() {
  return (
    <div className="min-h-dvh bg-pine app-surface text-ivory">
      <SiteHeader mode="host" current="updates" />
      <main className="mx-auto max-w-2xl px-4 pt-6 pb-16 md:px-10 md:pt-10">
        <UpdatesScreen />
      </main>
    </div>
  );
}
