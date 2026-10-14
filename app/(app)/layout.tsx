import { CityTransitionProvider } from "@/app/_components/city-transition";
import { MobileTabBar } from "@/app/_components/mobile-tab-bar";
import { Suspense } from "react";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <CityTransitionProvider>
      {children}
      <Suspense>
        <MobileTabBar />
      </Suspense>
    </CityTransitionProvider>
  );
}
