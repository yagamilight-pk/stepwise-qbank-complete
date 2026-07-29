import { createRouteMetadata } from "@/app/route-metadata";
import { StepwiseProvider } from "@/lib/store";
import { requireLearnerAccess } from "@/lib/auth";

export const metadata = createRouteMetadata(
  "Learner workspace",
  "Your private Stepwise study workspace.",
  true,
);

export default async function LearnerLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await requireLearnerAccess();
  return <StepwiseProvider cloudSyncEnabled={Boolean(user)}>{children}</StepwiseProvider>;
}
