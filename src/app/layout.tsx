import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./design-system.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://stepwise.page"),
  title: { default: "Stepwise — USMLE QBank", template: "%s | Stepwise" },
  description: "Adaptive USMLE Step 1 and Step 2 CK preparation with analytics, study planning, spaced repetition, and exam simulation.",
  applicationName: "Stepwise",
  category: "education",
  icons: { icon: "/icon.svg" },
  manifest: "/manifest.webmanifest",
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    title: "Stepwise — USMLE QBank",
    description: "Adaptive USMLE Step 1 and Step 2 CK preparation with question blocks, analytics, planning, and retention workflows.",
    siteName: "Stepwise"
  },
  twitter: {
    card: "summary_large_image",
    title: "Stepwise — USMLE QBank",
    description: "A focused USMLE preparation workspace for practice, review, planning, and retention."
  }
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
      <body>{children}</body>
    </html>
  );
}
