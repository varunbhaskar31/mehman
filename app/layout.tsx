import type { Metadata, Viewport } from "next";
import { DM_Serif_Display } from "next/font/google";
import "./globals.css";

const serif = DM_Serif_Display({
  variable: "--font-dm-serif",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Mehman",
  description: "People · Food · Cultures",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#1b2a1c",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${serif.variable} antialiased`}>
      <body>{children}</body>
    </html>
  );
}
