import { createRouteMetadata } from "@/app/route-metadata";
import { LegalDocument } from "@/components/LegalDocument";

export const metadata = createRouteMetadata(
  "Payment terms",
  "Review Stepwise one-time plan prices, payment confirmation, receipts, and disputes.",
);

export default function PaymentsRoute() {
  return <LegalDocument type="payments" />;
}
