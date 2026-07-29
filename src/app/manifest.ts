import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Stepwise USMLE QBank",
    short_name: "Stepwise",
    description: "A focused USMLE Step 1 and Step 2 CK preparation workspace.",
    start_url: "/app",
    display: "standalone",
    background_color: "#f7f9fc",
    theme_color: "#111827",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }]
  };
}
