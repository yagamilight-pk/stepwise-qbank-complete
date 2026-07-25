import { LegalPage } from "@/components/Support";
import { createRouteMetadata } from "@/app/route-metadata";

export const metadata = createRouteMetadata(
  "Terms of service",
  "Review the terms governing use of the Stepwise learning platform.",
);

export default function TermsRoute() {
  return <LegalPage type="terms" />;
}
