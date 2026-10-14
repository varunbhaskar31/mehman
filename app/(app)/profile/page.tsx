import type { Metadata } from "next";
import { SiteHeader } from "@/app/_components/site-header";
import { ProfileScreen } from "./profile-screen";

export const metadata: Metadata = {
  title: "Profile · Mehman",
};

export default function ProfilePage() {
  return (
    <div className="min-h-dvh bg-pine app-surface text-ivory">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 pt-6 pb-16 md:max-w-5xl md:px-10 md:pt-12 md:pb-24">
        <ProfileScreen />
      </main>
    </div>
  );
}
