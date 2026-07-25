import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./design-system.css";
import { StepwiseProvider } from "@/lib/store";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://stepwise.page"),
  title: { default: "Stepwise — USMLE QBank", template: "%s | Stepwise" },
  description: "Adaptive USMLE Step 1 and Step 2 CK preparation with analytics, study planning, spaced repetition, and exam simulation.",
  applicationName: "Stepwise",
  category: "education",
  icons: { icon: "/icon.svg" }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f8fb" },
    { media: "(prefers-color-scheme: dark)", color: "#090b10" }
  ]
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body><StepwiseProvider>{children}</StepwiseProvider></body>
    </html>
  );
}
