import type { Metadata } from "next";
import { SiteHeader } from "@/app/_components/site-header";
import { AdminReview } from "./admin-review";

export const metadata: Metadata = {
  title: "Review · Mehman team",
};

export default function AdminPage() {
  return (
    <div className="min-h-dvh bg-pine text-ivory">
      <SiteHeader mode="admin" current="admin-review" />
      <main className="mx-auto max-w-3xl px-4 pt-6 pb-16 md:px-10 md:pt-10">
        <AdminReview />
      </main>
    </div>
  );
}
