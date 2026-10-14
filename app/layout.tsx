import type { Metadata, Viewport } from "next";
import { DM_Sans, DM_Serif_Display, Kalam } from "next/font/google";
import "./globals.css";

const serif = DM_Serif_Display({
  variable: "--font-dm-serif",
  subsets: ["latin"],
  weight: "400",
});

// Matches the lettering of the button painted into the welcome artwork.
const ctaSans = DM_Sans({
  variable: "--font-cta",
  subsets: ["latin"],
  weight: "500",
});

// The host's handwritten greeting on the welcome screen.
const handwriting = Kalam({
  variable: "--font-hand",
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
  themeColor: "#1a110b",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${serif.variable} ${ctaSans.variable} ${handwriting.variable} antialiased`}
    >
      <body>{children}</body>
    </html>
  );
}
