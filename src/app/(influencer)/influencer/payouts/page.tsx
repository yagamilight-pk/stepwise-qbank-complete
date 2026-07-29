import { InfluencerShell } from "@/components/Shells";
import { createRouteMetadata } from "@/app/route-metadata";

export const metadata = createRouteMetadata(
  "Partner payouts",
  "Review balances, payout status, and revenue-share history.",
  true,
);

export default function InfluencerPayoutsPage() {
  return <InfluencerShell />;
}
