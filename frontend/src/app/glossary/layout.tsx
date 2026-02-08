import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Assessment Rules Glossary",
  description:
    "Complete glossary of DocDetector's 25+ assessment metrics. Understand what each score means, why it matters, and how it's calculated — from Trust Score to Manipulation Index to Bias Detection.",
  alternates: {
    canonical: "https://documentworthanalyser.web.app/glossary/",
  },
  openGraph: {
    title: "Assessment Rules Glossary | DocDetector",
    description:
      "Complete glossary of DocDetector's 25+ assessment metrics — Trust Score, Manipulation Index, Bias Detection, Fluff Score, and more.",
  },
};

export default function GlossaryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
