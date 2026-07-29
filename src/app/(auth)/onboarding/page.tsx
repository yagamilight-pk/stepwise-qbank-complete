import { OnboardingPage } from "@/components/Auth";
import { createRouteMetadata } from "@/app/route-metadata";

export const metadata = createRouteMetadata(
  "Personalize your study plan",
  "Set your exam, timeline, and study capacity to personalize Stepwise.",
  true,
);

export default function OnboardingRoute() {
  return <OnboardingPage />;
}
