import { AdminShell } from "@/components/Shells";
import { createRouteMetadata } from "@/app/route-metadata";

export const metadata = createRouteMetadata(
  "Question importer",
  "Import and validate Stepwise question content.",
  true,
);

export default function AdminImporterPage() {
  return <AdminShell />;
}
