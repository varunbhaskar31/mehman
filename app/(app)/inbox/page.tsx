import type { Metadata } from "next";
import { SiteHeader } from "@/app/_components/site-header";
import { InboxScreen } from "./inbox-screen";

export const metadata: Metadata = {
  title: "Inbox · Mehman",
};

export default function InboxPage() {
  return (
    <div className="min-h-dvh bg-pine text-ivory">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 pt-6 pb-16 md:px-10 md:pt-10">
        <InboxScreen />
      </main>
    </div>
  );
}
