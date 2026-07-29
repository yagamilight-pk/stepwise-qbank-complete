import { createRouteMetadata } from "@/app/route-metadata";
import { StepwiseProvider } from "@/lib/store";
import { requireAppwriteUser } from "@/lib/auth";

export const metadata = createRouteMetadata(
  "Administration",
  "Private Stepwise content and platform administration.",
  true,
);

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireAppwriteUser("admin");
  return <StepwiseProvider>{children}</StepwiseProvider>;
}
