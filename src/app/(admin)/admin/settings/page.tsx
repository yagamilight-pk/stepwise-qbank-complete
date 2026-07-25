import { AdminShell } from "@/components/Shells";
import { createRouteMetadata } from "@/app/route-metadata";

export const metadata = createRouteMetadata(
  "Admin settings",
  "Manage Stepwise administration preferences.",
  true,
);

export default function AdminSettingsPage() {
  return <AdminShell />;
}
