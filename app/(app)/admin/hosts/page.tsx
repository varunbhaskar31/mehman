import type { Metadata } from "next";
import { SiteHeader } from "@/app/_components/site-header";
import { AdminHosts } from "./admin-hosts";

export const metadata: Metadata = {
  title: "Hosts · Mehman team",
};

export default function Page() {
  return (
    <div className="min-h-dvh bg-pine app-surface text-ivory">
      <SiteHeader mode="admin" current="admin-hosts" />
      <main className="mx-auto max-w-3xl px-4 pt-6 pb-16 md:px-10 md:pt-10">
        <AdminHosts />
      </main>
    </div>
  );
}
