import { createRouteMetadata } from "@/app/route-metadata";
import { LegalDocument } from "@/components/LegalDocument";

export const metadata = createRouteMetadata(
  "Complaints and resolution policy",
  "Learn how Stepwise receives, investigates, and resolves customer complaints.",
);

export default function ComplaintsRoute() {
  return <LegalDocument type="complaints" />;
}
