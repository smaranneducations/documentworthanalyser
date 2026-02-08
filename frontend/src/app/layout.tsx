import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Providers from "@/components/Providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://documentworthanalyser.web.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "DocDetector — AI Forensic Analyst for Business Documents",
    template: "%s | DocDetector",
  },
  description:
    "Upload consulting proposals, vendor pitches, whitepapers, and advisory decks. Get AI-powered forensic analysis across 5 decision modules — detecting manipulation, bias, fluff, obsolescence, and hidden commercial motives.",
  keywords: [
    "document analysis", "AI forensics", "vendor assessment", "consulting proposal analyzer",
    "whitepaper analysis", "bias detection", "manipulation detection", "trust score",
    "document forensics", "AI document review", "business document analyzer",
    "vendor pitch analysis", "fluff detection", "hype detection", "advisory deck review",
    "digital transformation", "enterprise AI", "document trust score",
    "AI powered analysis", "content forensics", "deception detection",
  ],
  authors: [{ name: "DocDetector" }],
  creator: "DocDetector",
  publisher: "DocDetector",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: { url: "/logo.png", type: "image/png" },
    apple: { url: "/logo.png", type: "image/png" },
  },
  manifest: "/site.webmanifest",
  openGraph: {
    title: "DocDetector — AI Forensic Analyst for Business Documents",
    description:
      "Upload consulting proposals, vendor pitches, whitepapers, and advisory decks. AI forensic analysis across 5 decision modules, 25 weighted drivers, and content forensics.",
    siteName: "DocDetector",
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "DocDetector — AI Document Forensic Analyst",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "DocDetector — AI Forensic Analyst for Business Documents",
    description:
      "Upload consulting proposals, vendor pitches & whitepapers. Get AI-powered forensic analysis — manipulation, bias, fluff, and trust scoring.",
    images: ["/logo.png"],
  },
  alternates: {
    canonical: SITE_URL,
  },
  category: "Technology",
};

// ── JSON-LD Structured Data ──────────────────────────────────────────────
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "DocDetector",
  alternateName: "Document Worth Analyser",
  url: SITE_URL,
  description:
    "AI-powered forensic analysis tool for business documents. Detects manipulation, bias, fluff, obsolescence, and hidden commercial motives in consulting proposals, vendor pitches, whitepapers, and advisory decks.",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Any",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  featureList: [
    "AI-powered document forensic analysis",
    "Trust score with 25+ weighted drivers",
    "Manipulation and deception detection",
    "Bias detection (confirmation, survival, selection, recency, authority)",
    "Logical fallacy identification",
    "Hype vs reality assessment",
    "Implementation readiness scoring",
    "Obsolescence risk detection",
    "LinkedIn hashtag generation for sharing",
    "Section-level discussion with AI auto-reply",
    "Private and public file uploads",
    "Print-ready PDF highlight reel",
  ],
  screenshot: `${SITE_URL}/logo.png`,
  creator: {
    "@type": "Organization",
    name: "DocDetector",
    url: SITE_URL,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-zinc-950 text-zinc-100`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
