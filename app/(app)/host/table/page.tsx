import type { Metadata } from "next";
import { SiteHeader } from "@/app/_components/site-header";
import { HostTable } from "./host-table";

export const metadata: Metadata = {
  title: "My table · Hosting · Mehman",
};

export default function Page() {
  return (
    <div className="min-h-dvh bg-pine text-ivory">
      <SiteHeader mode="host" current="table" />
      <main className="mx-auto max-w-2xl px-4 pt-6 pb-16 md:px-10 md:pt-10">
        <HostTable />
      </main>
    </div>
  );
}
