import { CityTransitionProvider } from "@/app/_components/city-transition";
import { MobileTabBar } from "@/app/_components/mobile-tab-bar";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <CityTransitionProvider>
      {children}
      <MobileTabBar />
    </CityTransitionProvider>
  );
}
