import { createRouteMetadata } from "@/app/route-metadata";
import { StepwiseProvider } from "@/lib/store";
import { requireAppwriteUser } from "@/lib/auth";

export const metadata = createRouteMetadata(
  "Partner hub",
  "Private Stepwise affiliate and revenue-share workspace.",
  true,
);

export default async function InfluencerLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireAppwriteUser("influencer");
  return <StepwiseProvider>{children}</StepwiseProvider>;
}
