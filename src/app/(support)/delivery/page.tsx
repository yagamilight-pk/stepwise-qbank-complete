import { createRouteMetadata } from "@/app/route-metadata";
import { LegalDocument } from "@/components/LegalDocument";

export const metadata = createRouteMetadata(
  "Digital delivery policy",
  "Learn how one-time Stepwise access is activated after payment confirmation.",
);

export default function DeliveryRoute() {
  return <LegalDocument type="delivery" />;
}
