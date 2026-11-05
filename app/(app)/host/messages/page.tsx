import type { Metadata } from "next";
import { Suspense } from "react";
import { ChatScreen } from "@/app/_components/chat-screen";
import { SiteHeader } from "@/app/_components/site-header";

export const metadata: Metadata = {
  title: "Messages · Hosting · Mehman",
};

export default function Page() {
  return (
    <div className="min-h-dvh bg-pine app-surface text-ivory">
      <SiteHeader mode="host" current="messages" />
      <main className="mx-auto max-w-5xl px-4 pt-6 pb-16 md:px-10 md:pt-10">
        <Suspense fallback={<p className="py-16 text-center text-sm text-ivory/50">Loading…</p>}>
          <ChatScreen mode="host" />
        </Suspense>
      </main>
    </div>
  );
}
