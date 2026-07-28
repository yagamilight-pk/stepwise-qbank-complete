import { AuthPage } from "@/components/Auth";
import { createRouteMetadata } from "@/app/route-metadata";

export const metadata = createRouteMetadata(
  "Sign in",
  "Sign in to your Stepwise learner workspace.",
  true,
);

const protectedDestinations = ["/app", "/admin", "/influencer"];

function safeReturnTo(value: string | string[] | undefined) {
  if (typeof value !== "string") return undefined;
  return protectedDestinations.some(
    (prefix) => value === prefix || value.startsWith(`${prefix}/`),
  )
    ? value
    : undefined;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string | string[] }>;
}) {
  const params = await searchParams;
  return <AuthPage mode="login" returnTo={safeReturnTo(params.returnTo)} />;
}
