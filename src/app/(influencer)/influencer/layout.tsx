import { createRouteMetadata } from "@/app/route-metadata";

export const metadata = createRouteMetadata(
  "Partner hub",
  "Private Stepwise affiliate and revenue-share workspace.",
  true,
);

export default function InfluencerLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
