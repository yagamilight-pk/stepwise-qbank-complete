import { AdminShell } from "@/components/Shells";
import { createRouteMetadata } from "@/app/route-metadata";

export const metadata = createRouteMetadata(
  "Billing administration",
  "Review Stepwise billing and access operations.",
  true,
);

export default function AdminBillingPage() {
  return <AdminShell />;
}
