import { AdminShell } from "@/components/Shells";
import { createRouteMetadata } from "@/app/route-metadata";

export const metadata = createRouteMetadata(
  "Question explorer",
  "Explore, review, and edit Stepwise question content.",
  true,
);

export default function AdminQuestionsPage() {
  return <AdminShell />;
}
