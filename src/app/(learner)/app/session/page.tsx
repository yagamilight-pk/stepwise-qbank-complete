import { LearnerShell } from "@/components/Shells";
import { createRouteMetadata } from "@/app/route-metadata";

export const metadata = createRouteMetadata(
  "Question session",
  "Complete and review your active Stepwise question block.",
  true,
);

export default function SessionPage() {
  return <LearnerShell />;
}
