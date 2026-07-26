import { createRouteMetadata } from "@/app/route-metadata";
import { StepwiseProvider } from "@/lib/store";

export const metadata = createRouteMetadata(
  "Partner hub",
  "Private Stepwise affiliate and revenue-share workspace.",
  true,
);

export default function InfluencerLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <StepwiseProvider>{children}</StepwiseProvider>;
}
