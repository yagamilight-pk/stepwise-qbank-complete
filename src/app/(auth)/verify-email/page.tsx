import type { Metadata } from "next";
import { EmailVerificationPage } from "@/components/EmailVerification";

export const metadata: Metadata = {
  title: "Verify email",
  description: "Verify your Stepwise account email address.",
  robots: { index: false, follow: false },
};

export default async function VerifyEmailRoute({
  searchParams,
}: {
  searchParams: Promise<{ userId?: string; secret?: string }>;
}) {
  const params = await searchParams;
  return <EmailVerificationPage userId={params.userId} secret={params.secret} />;
}
