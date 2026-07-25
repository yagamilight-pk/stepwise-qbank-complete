import { LearnerShell } from "@/components/Shells";
import { createRouteMetadata } from "@/app/route-metadata";

export const metadata = createRouteMetadata(
  "Overview",
  "Review your next study action, readiness signal, and daily plan.",
  true,
);

export default function LearnerOverviewPage() {
  return <LearnerShell />;
}
