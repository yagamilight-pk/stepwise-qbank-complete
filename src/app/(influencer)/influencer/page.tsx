import { InfluencerShell } from "@/components/Shells";
import { createRouteMetadata } from "@/app/route-metadata";

export const metadata = createRouteMetadata(
  "Partner overview",
  "Review Stepwise partner performance and revenue-share activity.",
  true,
);

export default function InfluencerOverviewPage() {
  return <InfluencerShell />;
}
