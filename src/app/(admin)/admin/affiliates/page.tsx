import { AdminShell } from "@/components/Shells";
import { createRouteMetadata } from "@/app/route-metadata";

export const metadata = createRouteMetadata(
  "Affiliates and revenue share",
  "Manage Stepwise partner access and revenue-share records.",
  true,
);

export default function AdminAffiliatesPage() {
  return <AdminShell />;
}
