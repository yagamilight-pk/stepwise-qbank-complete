import { ForgotPasswordPage } from "@/components/Support";
import { createRouteMetadata } from "@/app/route-metadata";

export const metadata = createRouteMetadata(
  "Reset password",
  "Request a Stepwise password reset.",
  true,
);

export default function ForgotPasswordRoute() {
  return <ForgotPasswordPage />;
}
