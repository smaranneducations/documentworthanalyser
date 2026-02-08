import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DocDetector — AI Forensic Analyst for Business Documents",
  description:
    "Upload consulting proposals, vendor pitches, whitepapers, and advisory decks. Get AI-powered forensic analysis across 5 decision modules — detecting manipulation, bias, fluff, obsolescence, and hidden commercial motives.",
  icons: {
    icon: { url: "/icon-32.svg", type: "image/svg+xml" },
  },
  openGraph: {
    title: "DocDetector — AI Forensic Analyst for Business Documents",
    description:
      "Upload consulting proposals, vendor pitches, whitepapers, and advisory decks. AI forensic analysis across 5 decision modules, 25 weighted drivers, and content forensics.",
    siteName: "DocDetector",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-zinc-950 text-zinc-100`}
      >
        {children}
      </body>
    </html>
  );
}
