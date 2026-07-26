import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://stepwise.page";
  return {
    rules: [{
      userAgent: "*",
      allow: ["/", "/try", "/help", "/privacy", "/terms"],
      disallow: ["/app/", "/admin/", "/influencer/", "/login", "/signup", "/onboarding"]
    }],
    sitemap: `${base}/sitemap.xml`
  };
}
