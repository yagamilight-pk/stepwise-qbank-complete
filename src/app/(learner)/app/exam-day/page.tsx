import { LearnerShell } from "@/components/Shells";
import { createRouteMetadata } from "@/app/route-metadata";

export const metadata = createRouteMetadata(
  "Exam-day rehearsal",
  "Rehearse USMLE block timing, break allocation, block closure, and recovery.",
  true,
);

export default function ExamDayRoute() {
  return <LearnerShell />;
}
