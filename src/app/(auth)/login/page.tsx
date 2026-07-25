import { AuthPage } from "@/components/Auth";
import { createRouteMetadata } from "@/app/route-metadata";

export const metadata = createRouteMetadata(
  "Sign in",
  "Sign in to your Stepwise learner workspace.",
  true,
);

export default function LoginPage() {
  return <AuthPage mode="login" />;
}
