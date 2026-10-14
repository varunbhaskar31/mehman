import { MobileTabBar } from "@/app/_components/mobile-tab-bar";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      {children}
      <MobileTabBar />
    </>
  );
}
