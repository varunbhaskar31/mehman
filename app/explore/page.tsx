import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Explore · Mehman",
};

export default function ExplorePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="font-serif text-5xl text-forest">Mehman</h1>
      <p className="text-base text-forest/80">
        Explore India&rsquo;s cultures. Coming soon.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-full px-4 py-2 text-sm font-medium text-terracotta underline-offset-4 hover:underline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-forest"
      >
        ← Back to welcome
      </Link>
    </main>
  );
}
