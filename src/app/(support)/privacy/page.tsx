import { LegalPage } from "@/components/Support";
import { createRouteMetadata } from "@/app/route-metadata";

export const metadata = createRouteMetadata(
  "Privacy policy",
  "Learn how Stepwise handles learner, account, and product usage data.",
);

export default function PrivacyRoute() {
  return <LegalPage type="privacy" />;
}
