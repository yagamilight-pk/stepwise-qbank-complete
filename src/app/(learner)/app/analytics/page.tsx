import { LearnerShell } from "@/components/Shells";
import { createRouteMetadata } from "@/app/route-metadata";

export const metadata = createRouteMetadata(
  "Analytics",
  "Understand your accuracy, pacing, confidence, coverage, and readiness trends.",
  true,
);

export default function AnalyticsPage() {
  return <LearnerShell />;
}
