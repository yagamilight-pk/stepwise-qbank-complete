import type { Metadata } from "next";

export function createRouteMetadata(
  title: string,
  description: string,
  isPrivate = false,
): Metadata {
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: "Stepwise",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    ...(isPrivate ? { robots: { index: false, follow: false } } : {}),
  };
}
