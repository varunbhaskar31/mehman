import type { Metadata } from "next";
import { ExploreScreen } from "./explore-screen";

export const metadata: Metadata = {
  title: "Explore · Mehman",
};

export default function ExplorePage() {
  return <ExploreScreen />;
}
