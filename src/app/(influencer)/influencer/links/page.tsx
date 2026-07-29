import { InfluencerShell } from "@/components/Shells";
import { createRouteMetadata } from "@/app/route-metadata";

export const metadata = createRouteMetadata(
  "Partner links and codes",
  "Create and manage Stepwise partner links and promotion codes.",
  true,
);

export default function InfluencerLinksPage() {
  return <InfluencerShell />;
}
