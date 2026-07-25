import { LearnerShell } from "@/components/Shells";
import { createRouteMetadata } from "@/app/route-metadata";

export const metadata = createRouteMetadata(
  "Notebook",
  "Review study notes connected to questions and explanations.",
  true,
);

export default function NotebookPage() {
  return <LearnerShell />;
}
