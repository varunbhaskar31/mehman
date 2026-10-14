import { CityTransitionProvider } from "@/app/_components/city-transition";
import { MobileTabBar } from "@/app/_components/mobile-tab-bar";
import { SiteFooter } from "@/app/_components/site-footer";
import { Suspense } from "react";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <CityTransitionProvider>
      {children}
      <Suspense>
        <SiteFooter />
      </Suspense>
      <Suspense>
        <MobileTabBar />
      </Suspense>
    </CityTransitionProvider>
  );
}
