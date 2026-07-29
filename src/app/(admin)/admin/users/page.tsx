import { AdminShell } from "@/components/Shells";
import { createRouteMetadata } from "@/app/route-metadata";

export const metadata = createRouteMetadata(
  "User administration",
  "Review and manage Stepwise learner accounts.",
  true,
);

export default function AdminUsersPage() {
  return <AdminShell />;
}
