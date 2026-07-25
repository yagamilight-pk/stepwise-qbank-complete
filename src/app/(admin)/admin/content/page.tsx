import { AdminShell } from "@/components/Shells";
import { createRouteMetadata } from "@/app/route-metadata";

export const metadata = createRouteMetadata(
  "Content map",
  "Review blueprint coverage and editorial recommendations.",
  true,
);

export default function AdminContentPage() {
  return <AdminShell />;
}
