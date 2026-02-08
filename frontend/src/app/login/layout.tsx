import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
  description:
    "Sign in with Google to access private file assessments and starred comments on DocDetector.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
