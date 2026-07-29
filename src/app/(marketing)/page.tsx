import type { Metadata } from "next";
import { MarketingPage } from "@/components/Marketing";

export const metadata: Metadata = {
  title: { absolute: "Stepwise — Adaptive USMLE QBank" },
  description:
    "Prepare for USMLE Step 1 and Step 2 CK with adaptive question blocks, clear explanations, study planning, and performance analytics.",
  openGraph: {
    title: "Stepwise — Adaptive USMLE QBank",
    description: "Turn every missed question into a clear correction and a concrete next review.",
    siteName: "Stepwise",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Stepwise — Adaptive USMLE QBank",
    description: "Turn every missed question into a clear correction and a concrete next review.",
  },
};

export default function HomePage() {
  return <MarketingPage />;
}
