import { LearnerShell } from "@/components/Shells";
import { createRouteMetadata } from "@/app/route-metadata";

export const metadata = createRouteMetadata(
  "Study plan",
  "Review and manage your personalized Stepwise study plan.",
  true,
);

export default function StudyPlanPage() {
  return <LearnerShell />;
}
