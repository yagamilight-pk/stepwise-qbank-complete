"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, fontFamily: "system-ui" }}>
          <section role="alert" style={{ maxWidth: 520 }}>
            <h1>Stepwise could not load</h1>
            <p>Your saved learning history is unchanged. Refresh the page or contact support if this continues.</p>
          </section>
        </main>
      </body>
    </html>
  );
}
