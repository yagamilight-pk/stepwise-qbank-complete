import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://stepwise.page";
  const routes = ["", "/try", "/help", "/privacy", "/terms"];
  return routes.map((route, index) => ({
    url: `${base}${route}`,
    changeFrequency: index === 0 ? "weekly" : "monthly",
    priority: index === 0 ? 1 : route === "/try" ? 0.8 : 0.4
  }));
}
