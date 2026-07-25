import { createRouteMetadata } from "@/app/route-metadata";

export const metadata = createRouteMetadata(
  "Learner workspace",
  "Your private Stepwise study workspace.",
  true,
);

export default function LearnerLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
