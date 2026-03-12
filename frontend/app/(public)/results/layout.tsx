import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wellness Results",
  description:
    "Search and compare professionals, products, and influencers on Wolistic based on your wellness goals.",
  alternates: {
    canonical: "/results",
  },
};

export default function ResultsLayout({ children }: { children: React.ReactNode }) {
  return children;
}