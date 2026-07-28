import { ResetPasswordPage } from "@/components/Support";
import { createRouteMetadata } from "@/app/route-metadata";

export const metadata = createRouteMetadata(
  "Choose a new password",
  "Complete a secure Stepwise password recovery.",
  true,
);

export default async function ResetPasswordRoute({
  searchParams,
}: {
  searchParams: Promise<{ userId?: string; secret?: string }>;
}) {
  const params = await searchParams;
  return <ResetPasswordPage userId={params.userId ?? ""} secret={params.secret ?? ""}/>;
}
