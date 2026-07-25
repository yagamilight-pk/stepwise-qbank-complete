import { createRouteMetadata } from "@/app/route-metadata";

export const metadata = createRouteMetadata(
  "Account",
  "Access and configure your Stepwise learner account.",
  true,
);

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
