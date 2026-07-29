import { LearnerShell } from "@/components/Shells";
import { createRouteMetadata } from "@/app/route-metadata";

export const metadata = createRouteMetadata(
  "Settings",
  "Manage your Stepwise profile, preferences, data, and subscription interface.",
  true,
);

export default function LearnerSettingsPage() {
  return <LearnerShell />;
}
