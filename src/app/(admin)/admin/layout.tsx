import { createRouteMetadata } from "@/app/route-metadata";

export const metadata = createRouteMetadata(
  "Administration",
  "Private Stepwise content and platform administration.",
  true,
);

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
