import { LearnerShell } from "@/components/Shells";
import { createRouteMetadata } from "@/app/route-metadata";

export const metadata = createRouteMetadata(
  "Medical library",
  "Explore Stepwise medical reference articles and linked question content.",
  true,
);

export default function LibraryPage() {
  return <LearnerShell />;
}
