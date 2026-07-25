import { LegalPage } from "@/components/Support";
import { createRouteMetadata } from "@/app/route-metadata";

export const metadata = createRouteMetadata(
  "Cookie policy",
  "Learn how Stepwise uses cookies and local browser storage.",
);

export default function CookiesRoute() {
  return <LegalPage type="cookies" />;
}
