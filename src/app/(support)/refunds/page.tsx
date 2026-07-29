import { createRouteMetadata } from "@/app/route-metadata";
import { LegalDocument } from "@/components/LegalDocument";

export const metadata = createRouteMetadata(
  "Refund and cancellation policy",
  "Review Stepwise refund eligibility, request steps, and processing times.",
);

export default function RefundsRoute() {
  return <LegalDocument type="refunds" />;
}
