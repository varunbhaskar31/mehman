import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteHeader } from "@/app/_components/site-header";
import { TableScreen } from "./table-screen";

export const metadata: Metadata = {
  title: "A family table · Mehman",
};

async function TableFromParams({ params }: { params: PageProps<"/tables/[id]">["params"] }) {
  const { id } = await params;
  return <TableScreen tableId={id} />;
}

export default function TablePage({ params }: PageProps<"/tables/[id]">) {
  return (
    <div className="min-h-dvh bg-pine text-ivory">
      <SiteHeader current="explore" />
      <main className="mx-auto max-w-3xl pt-4 pb-16 md:px-10 md:pt-8">
        <Suspense fallback={<p className="py-16 text-center text-sm text-ivory/50">Loading…</p>}>
          <TableFromParams params={params} />
        </Suspense>
      </main>
    </div>
  );
}
