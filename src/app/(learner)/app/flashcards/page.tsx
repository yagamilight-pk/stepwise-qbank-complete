import { LearnerShell } from "@/components/Shells";
import { createRouteMetadata } from "@/app/route-metadata";

export const metadata = createRouteMetadata(
  "Flashcards",
  "Review due cards and consolidate learning from question explanations.",
  true,
);

export default function FlashcardsPage() {
  return <LearnerShell />;
}
