"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BadgeCheck, CircleAlert, LoaderCircle, MailCheck } from "lucide-react";
import { completeEmailVerification, resendEmailVerification } from "@/app/actions/auth";
import { Logo } from "./ui";

export function EmailVerificationPage({ userId, secret }: { userId?: string; secret?: string }) {
  const [status, setStatus] = useState<"loading" | "success" | "error" | "resent">(
    userId && secret ? "loading" : "error",
  );
  const [message, setMessage] = useState(
    userId && secret ? "Confirming your email address…" : "This verification link is incomplete.",
  );
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!userId || !secret) return;
    let active = true;
    completeEmailVerification(userId, secret).then((result) => {
      if (!active) return;
      if (result.success) {
        setStatus("success");
        setMessage("Your email address is verified. Your account can now purchase and use paid access.");
      } else {
        setStatus("error");
        setMessage(result.error ?? "This verification link is invalid or expired.");
      }
    });
    return () => {
      active = false;
    };
  }, [secret, userId]);

  const resend = async () => {
    setResending(true);
    const result = await resendEmailVerification();
    setResending(false);
    if (result.success) {
      setStatus("resent");
      setMessage(result.verificationSent ? "A new verification link has been sent." : "Your email is already verified.");
    } else {
      setStatus("error");
      setMessage(result.error ?? "Unable to send another verification link.");
    }
  };

  const Icon = status === "loading" ? LoaderCircle : status === "success" ? BadgeCheck : status === "resent" ? MailCheck : CircleAlert;
  return (
    <main className="recovery-page">
      <section>
        <Logo />
        <div className="recovery-card" role="status" aria-live="polite">
          <span><Icon className={status === "loading" ? "spin" : ""} aria-hidden="true" /></span>
          <h1>{status === "success" ? "Email verified" : status === "resent" ? "Check your inbox" : status === "loading" ? "Verifying email" : "Verification needed"}</h1>
          <p>{message}</p>
          {status !== "loading" && (
            <>
              <Link className="btn btn-brand btn-block" href="/app">Open learner workspace</Link>
              {status === "error" && (
                <button type="button" className="btn btn-secondary btn-block" onClick={resend} disabled={resending}>
                  {resending ? "Sending…" : "Send a new verification link"}
                </button>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
}
