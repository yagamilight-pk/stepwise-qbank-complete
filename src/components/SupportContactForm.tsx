"use client";

import { useState } from "react";
import { CheckCircle2, LifeBuoy, Send } from "lucide-react";

const categories = ["Account", "Billing", "Question content", "Technical", "Accessibility", "Other"] as const;

export function SupportContactForm() {
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");
  const [ticketId, setTicketId] = useState("");

  if (status === "sent") {
    return <section className="support-contact support-confirmation" aria-live="polite">
      <span><CheckCircle2 aria-hidden="true"/></span>
      <div>
        <p className="eyebrow">Request received</p>
        <h2>We have your support request.</h2>
        <p>Reference <strong>{ticketId}</strong>. We also sent an acknowledgement to the email you provided when email delivery is configured.</p>
        <button className="btn btn-secondary" type="button" onClick={() => {
          setStatus("idle");
          setTicketId("");
          setStartedAt(Date.now());
        }}>Send another request</button>
      </div>
    </section>;
  }

  return <section className="support-contact" aria-labelledby="support-contact-title">
    <header>
      <span><LifeBuoy aria-hidden="true"/></span>
      <div>
        <p className="eyebrow">Tracked support</p>
        <h2 id="support-contact-title">Tell us what went wrong.</h2>
        <p>Account, billing, accessibility, technical, and question-content requests receive a reference you can keep.</p>
      </div>
    </header>
    <form onSubmit={async event => {
      event.preventDefault();
      setStatus("sending");
      setError("");
      const form = new FormData(event.currentTarget);
      const response = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          category: form.get("category"),
          subject: form.get("subject"),
          message: form.get("message"),
          website: form.get("website"),
          sourceUrl: window.location.href,
          startedAt,
        }),
      });
      const result = await response.json().catch(() => ({})) as { ticketId?: string; error?: string };
      if (!response.ok || !result.ticketId) {
        setStatus("idle");
        setError(result.error || "We could not create the request. Email support@stepwise.page instead.");
        return;
      }
      setTicketId(result.ticketId);
      setStatus("sent");
    }}>
      <div className="support-form-grid">
        <label><span>Name</span><input name="name" required minLength={2} maxLength={120} autoComplete="name"/></label>
        <label><span>Email</span><input name="email" type="email" required maxLength={320} autoComplete="email"/></label>
      </div>
      <label><span>Category</span><select name="category" defaultValue="Technical">{categories.map(category => <option key={category}>{category}</option>)}</select></label>
      <label><span>Subject</span><input name="subject" required minLength={4} maxLength={240}/></label>
      <label><span>What happened?</span><textarea name="message" required minLength={20} maxLength={8_000} rows={7} placeholder="Include the page, the action you took, what you expected, and what happened."/></label>
      <label className="support-honeypot" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off"/></label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <footer>
        <p>Do not include passwords, recovery codes, payment-card details, or patient information.</p>
        <button className="btn btn-brand" type="submit" disabled={status === "sending"}><Send aria-hidden="true"/> {status === "sending" ? "Sending…" : "Send request"}</button>
      </footer>
    </form>
  </section>;
}
