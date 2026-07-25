import { AuthPage } from "@/components/Auth";
import { createRouteMetadata } from "@/app/route-metadata";

export const metadata = createRouteMetadata(
  "Create an account",
  "Create your Stepwise learner workspace.",
  true,
);

export default function SignupPage() {
  return <AuthPage mode="signup" />;
}
