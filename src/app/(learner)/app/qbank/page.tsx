import { LearnerShell } from "@/components/Shells";
import { createRouteMetadata } from "@/app/route-metadata";

export const metadata = createRouteMetadata(
  "QBank",
  "Build an adaptive, timed, or tutor-mode USMLE question block.",
  true,
);

export default function QBankPage() {
  return <LearnerShell />;
}
