import { InfluencerShell } from "@/components/Shells";
import { createRouteMetadata } from "@/app/route-metadata";

export const metadata = createRouteMetadata(
  "Conversions and ledger",
  "Review attributed Stepwise conversions and partner earnings.",
  true,
);

export default function InfluencerConversionsPage() {
  return <InfluencerShell />;
}
