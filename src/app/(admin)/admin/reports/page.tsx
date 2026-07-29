import { AdminShell } from "@/components/Shells";
import { createRouteMetadata } from "@/app/route-metadata";

export const metadata = createRouteMetadata(
  "Content reports",
  "Review and resolve learner reports about question content.",
  true,
);

export default function AdminReportsPage() {
  return <AdminShell />;
}
