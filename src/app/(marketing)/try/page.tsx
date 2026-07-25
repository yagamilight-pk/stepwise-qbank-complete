import { DemoPage } from "@/components/Demo";
import { createRouteMetadata } from "@/app/route-metadata";

export const metadata = createRouteMetadata(
  "Try the QBank",
  "Experience a five-question Stepwise guided trial with immediate explanations and learning feedback.",
);

export default function TryPage() {
  return <DemoPage />;
}
