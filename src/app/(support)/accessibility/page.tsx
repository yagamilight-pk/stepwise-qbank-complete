import { LegalPage } from "@/components/Support";
import { createRouteMetadata } from "@/app/route-metadata";

export const metadata = createRouteMetadata(
  "Accessibility",
  "Read the Stepwise accessibility commitment and support channels.",
);

export default function AccessibilityRoute() {
  return <LegalPage type="accessibility" />;
}
