import { InfluencerShell } from "@/components/Shells";
import { createRouteMetadata } from "@/app/route-metadata";

export const metadata = createRouteMetadata(
  "Partner media kit",
  "Access approved Stepwise partner messaging and media assets.",
  true,
);

export default function InfluencerMediaPage() {
  return <InfluencerShell />;
}
