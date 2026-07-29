"use client";

import Link from "next/link";
import { CircleAlert, RotateCcw } from "lucide-react";
import { Logo } from "@/components/ui";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="recovery-page">
      <section>
        <Logo />
        <div className="recovery-card" role="alert">
          <span><CircleAlert /></span>
          <h1>Something interrupted this page</h1>
          <p>Your saved study data is unchanged. Try loading this view again.</p>
          {error.digest && <small>Reference: {error.digest}</small>}
          <button className="btn btn-brand btn-block" onClick={reset}>
            <RotateCcw /> Try again
          </button>
          <Link href="/">Return home</Link>
        </div>
      </section>
    </main>
  );
}
