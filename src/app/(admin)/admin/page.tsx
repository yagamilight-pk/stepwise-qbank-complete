import { AdminShell } from "@/components/Shells";
import { createRouteMetadata } from "@/app/route-metadata";

export const metadata = createRouteMetadata(
  "Admin overview",
  "Monitor Stepwise content coverage and operational queues.",
  true,
);

export default function AdminOverviewPage() {
  return <AdminShell />;
}
