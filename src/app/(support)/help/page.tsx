import { HelpPage } from "@/components/Support";
import { createRouteMetadata } from "@/app/route-metadata";

export const metadata = createRouteMetadata(
  "Help center",
  "Find guidance for Stepwise question sessions, analytics, study planning, billing, and privacy.",
);

export default function HelpRoute() {
  return <HelpPage />;
}
