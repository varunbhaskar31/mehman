import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { culturalRegions, findRegion } from "@/data/discovery";
import { CultureScreen } from "./culture-screen";
import { CultureView } from "./culture-view";

export function generateStaticParams() {
  return culturalRegions.map((region) => ({ slug: region.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/culture/[slug]">): Promise<Metadata> {
  const region = findRegion((await params).slug);
  return { title: region ? `A taste of ${region.name} · Mehman` : "Mehman" };
}

export default async function CulturePage({
  params,
}: PageProps<"/culture/[slug]">) {
  const region = findRegion((await params).slug);
  if (!region) notFound();

  return (
    <Suspense fallback={<CultureView region={region} />}>
      <CultureScreen region={region} />
    </Suspense>
  );
}
