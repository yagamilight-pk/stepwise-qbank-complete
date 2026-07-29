import { LearnerShell } from "@/components/Shells";
import { createRouteMetadata } from "@/app/route-metadata";

export const metadata = createRouteMetadata(
  "Study circle",
  "Use privacy-aware accountability and study-circle tools.",
  true,
);

export default function CommunityPage() {
  return <LearnerShell />;
}
