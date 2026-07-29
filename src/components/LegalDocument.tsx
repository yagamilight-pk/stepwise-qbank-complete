import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  CircleAlert,
  FileText,
  Mail,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { getMerchantIdentityReadiness } from "@/lib/merchant";
import { Logo } from "./ui";

export type LegalDocumentType =
  | "terms"
  | "privacy"
  | "refunds"
  | "delivery"
  | "complaints"
  | "payments"
  | "cookies"
  | "accessibility";

const UPDATED = "July 29, 2026";

const policyLinks: Array<[LegalDocumentType, string]> = [
  ["terms", "Terms"],
  ["privacy", "Privacy"],
  ["payments", "Payments"],
  ["refunds", "Refunds"],
  ["delivery", "Delivery"],
  ["complaints", "Complaints"],
  ["cookies", "Cookies"],
  ["accessibility", "Accessibility"],
];

function IdentitySection() {
  const merchant = getMerchantIdentityReadiness();
  const identity = merchant.identity;

  return (
    <section>
      <h2>Merchant identity and contact</h2>
      {merchant.ready ? (
        <>
          <p>
            Stepwise is operated by <strong>{identity.legalBusinessName}</strong>, a{" "}
            {identity.registrationType.toLowerCase()} registered in Pakistan under number{" "}
            {identity.registrationNumber}, tax registration {identity.taxNumber}.
          </p>
          <dl className="legal-identity">
            <div><dt><Building2 /> Registered address</dt><dd>{identity.registeredAddress}</dd></div>
            <div><dt><Building2 /> Operating address</dt><dd>{identity.operatingAddress}</dd></div>
            <div><dt><Mail /> Customer support</dt><dd><a href={`mailto:${identity.supportEmail}`}>{identity.supportEmail}</a></dd></div>
            <div><dt><Phone /> Phone</dt><dd><a href={`tel:${identity.supportPhone.replace(/\s/g, "")}`}>{identity.supportPhone}</a></dd></div>
          </dl>
        </>
      ) : (
        <div className="legal-readiness-notice">
          <CircleAlert />
          <div>
            <b>Commercial activation is intentionally blocked.</b>
            <p>
              Stepwise is not accepting payments until its verified legal business name,
              registration, tax number, Pakistan addresses, and support phone are published
              here and match the payment-provider application.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

function TermsPolicy() {
  return (
    <>
      <IdentitySection />
      <section>
        <h2>1. Agreement and eligibility</h2>
        <p>
          These Terms govern access to the Stepwise website, learner workspace, question
          bank, analytics, planning, notes, flashcards, support, and related services. By
          creating an account or purchasing access, you agree to these Terms and the linked
          policies. You must be at least 18 years old and able to enter a binding agreement.
        </p>
      </section>
      <section>
        <h2>2. Educational service—not medical advice</h2>
        <p>
          Stepwise is an examination-preparation product. It is not a medical device and
          does not provide diagnosis, treatment, patient-specific advice, or a substitute
          for professional judgment. Do not use it for clinical decisions. Stepwise is
          independent and is not affiliated with, sponsored by, or endorsed by USMLE,
          NBME, FSMB, or any medical licensing authority.
        </p>
      </section>
      <section>
        <h2>3. Accounts and security</h2>
        <p>
          Provide accurate account information, keep your credentials confidential, and
          notify support promptly of suspected misuse. Accounts and paid access are
          personal and may not be shared, sold, transferred, scraped, or used to distribute
          question content. We may require email verification and may suspend activity that
          threatens learners, content rights, payment integrity, or system security.
        </p>
      </section>
      <section>
        <h2>4. Access plans and payment</h2>
        <p>
          Stepwise offers one-time 90-, 180-, and 360-day access plans. They do not renew
          automatically. The price, currency, access period, and total are shown before
          payment. Access begins only after a valid signed payment confirmation. Buying
          another plan extends unexpired access. The <Link href="/payments">Payment Terms</Link>,{" "}
          <Link href="/delivery">Digital Delivery Policy</Link>, and{" "}
          <Link href="/refunds">Refund Policy</Link> form part of these Terms.
        </p>
      </section>
      <section>
        <h2>5. Acceptable use and content rights</h2>
        <p>
          You receive a limited, revocable, non-exclusive, non-transferable right to use
          Stepwise for personal study during your access period. You may not reproduce,
          publish, sell, reverse engineer, automate access to, bypass controls on, or create
          derivative question banks from the service. Notes you author remain yours; you
          grant Stepwise the limited rights needed to store, synchronize, and display them
          back to you.
        </p>
      </section>
      <section>
        <h2>6. Availability, changes, and termination</h2>
        <p>
          We may maintain or improve the service, correct content, and change features
          without reducing an already purchased access period. Planned maintenance will be
          communicated when practical. We may suspend or terminate access for material
          breach, fraud, abuse, security risk, or unlawful use. Statutory rights and eligible
          refunds are not excluded.
        </p>
      </section>
      <section>
        <h2>7. Disclaimers and liability</h2>
        <p>
          Results, readiness indicators, and study recommendations are estimates based on
          available learner activity; no score, exam result, or professional outcome is
          guaranteed. To the extent permitted by applicable law, Stepwise is not liable for
          indirect, incidental, or consequential loss. Nothing in these Terms limits
          liability that cannot lawfully be limited, including fraud or willful misconduct.
        </p>
      </section>
      <section>
        <h2>8. Governing law, complaints, and changes</h2>
        <p>
          These Terms are governed by the laws of Pakistan, without removing mandatory
          consumer protections that apply to you. Please use the{" "}
          <Link href="/complaints">Complaints Policy</Link> before commencing a formal
          dispute so we can investigate. Material changes will be dated and, where required,
          communicated before they take effect.
        </p>
      </section>
    </>
  );
}

function PrivacyPolicy() {
  return (
    <>
      <IdentitySection />
      <section>
        <h2>1. Data we collect</h2>
        <p>
          We collect account data (name, email, verification and session status), learner
          data (answers, timing, confidence, notes, cards, plans, settings, and progress),
          support correspondence, security and audit records, device/browser diagnostics,
          and purchase records such as order, plan, amount, currency, status, and access
          expiry. Stepwise does not receive or store your full card number.
        </p>
      </section>
      <section>
        <h2>2. Why we use it</h2>
        <p>
          We use data to authenticate you, deliver and synchronize the learning service,
          compute your own analytics and adaptive recommendations, provide support, verify
          entitlements, prevent abuse, reconcile payments, meet legal obligations, and
          improve reliability. We do not sell personal data or use learner answers for
          third-party advertising.
        </p>
      </section>
      <section>
        <h2>3. Providers and disclosure</h2>
        <p>
          Necessary data may be processed by Appwrite (authentication and application
          data), Vercel (hosting), Resend (transactional email), Safepay and its payment
          partners (payment processing), and Sentry only when monitoring is configured.
          We also disclose data when legally required, to protect users and the service, or
          as part of a properly safeguarded business transfer.
        </p>
      </section>
      <section>
        <h2>4. Storage, transfers, and security</h2>
        <p>
          Data may be processed outside your country where our providers operate. We use
          access controls, encrypted transport, secure session cookies, row-level
          permissions, signed payment webhooks, and audit records. No system is risk-free;
          report suspected security issues to{" "}
          <a href="mailto:admin@stepwise.page">admin@stepwise.page</a>.
        </p>
      </section>
      <section>
        <h2>5. Retention</h2>
        <p>
          Account and learner data are retained while your account is active. Verified
          deletion requests are completed within 30 days unless records must be retained
          for security, dispute, tax, accounting, or other legal obligations. Support
          records are normally retained for 24 months; payment and accounting records may
          be retained for up to seven years. Encrypted backups age out on their normal
          rotation, generally within 90 days.
        </p>
      </section>
      <section>
        <h2>6. Your choices and rights</h2>
        <p>
          You can export learner data from Settings. You may request access, correction,
          deletion, restriction, or a copy of personal data by emailing{" "}
          <a href="mailto:privacy@stepwise.page">privacy@stepwise.page</a>. We verify
          identity before acting and normally respond within 30 days. You may also complain
          to an applicable data-protection or consumer authority.
        </p>
      </section>
      <section>
        <h2>7. Children and policy changes</h2>
        <p>
          Stepwise is not directed to children under 18 and does not knowingly create their
          accounts. We will investigate and delete an underage account when appropriately
          verified. Material policy changes will be dated and communicated where required.
        </p>
      </section>
    </>
  );
}

function RefundPolicy() {
  return (
    <>
      <IdentitySection />
      <section>
        <h2>Eligibility for a refund</h2>
        <p>
          You may request a refund within seven calendar days of the original purchase if
          fewer than 50 questions have been attempted during that paid access period.
          Duplicate charges, confirmed unauthorized payments, failure to activate access,
          or a material service outage may be refunded regardless of that usage threshold.
          Mandatory consumer rights continue to apply.
        </p>
      </section>
      <section>
        <h2>Items that are not normally refundable</h2>
        <p>
          A change of exam date, unused time after the seven-day request window, partial use
          beyond the threshold, account suspension for a material Terms breach, or
          dissatisfaction with an exam result does not normally qualify. A new purchase
          that extends existing access is assessed from that purchase date and its own use.
        </p>
      </section>
      <section>
        <h2>How to request and what happens next</h2>
        <p>
          Email <a href="mailto:billing@stepwise.page">billing@stepwise.page</a> or submit
          the <Link href="/help">support form</Link> with the account email, order reference,
          purchase date, and reason. We acknowledge requests within two business days and
          issue a decision within seven business days. Approved refunds are sent to the
          original payment method; provider or bank processing may take up to ten additional
          business days. Refunded access is revoked when the refund is approved.
        </p>
      </section>
      <section>
        <h2>Cancellations</h2>
        <p>
          Plans are one-time purchases with no automatic renewal, so there is no recurring
          subscription to cancel. You can stop using Stepwise at any time. If you close the
          hosted checkout before payment confirmation, no access period begins.
        </p>
      </section>
    </>
  );
}

function DeliveryPolicy() {
  return (
    <>
      <IdentitySection />
      <section>
        <h2>Digital delivery only</h2>
        <p>
          Stepwise sells access to an online educational service; no physical item is
          shipped. The selected 90-, 180-, or 360-day access period is delivered to the
          verified Stepwise account used at checkout.
        </p>
      </section>
      <section>
        <h2>Activation timing</h2>
        <p>
          Access normally activates within minutes after Safepay sends a valid signed
          payment confirmation. The return page may briefly show “pending” while that
          confirmation is processed. A receipt is emailed when transactional email is
          available. Do not make a second payment while an order is pending.
        </p>
      </section>
      <section>
        <h2>Delayed or failed delivery</h2>
        <p>
          If paid access is not active within 24 hours, contact{" "}
          <a href="mailto:support@stepwise.page">support@stepwise.page</a> with the account
          email and order reference. We will reconcile the provider record, activate valid
          access, or refund an unfulfilled payment under the <Link href="/refunds">Refund Policy</Link>.
        </p>
      </section>
    </>
  );
}

function ComplaintsPolicy() {
  return (
    <>
      <IdentitySection />
      <section>
        <h2>How to submit a complaint</h2>
        <p>
          Use the <Link href="/help">support form</Link> or email{" "}
          <a href="mailto:support@stepwise.page">support@stepwise.page</a>. For payment or
          refund matters use <a href="mailto:billing@stepwise.page">billing@stepwise.page</a>.
          Include your account email, relevant order or question ID, what happened, when it
          happened, and the outcome you are seeking. Do not send passwords or card numbers.
        </p>
      </section>
      <section>
        <h2>Response and resolution times</h2>
        <p>
          We acknowledge complaints within two business days. We aim to resolve ordinary
          support and billing complaints within ten business days. If a complex
          investigation needs more time, we will explain why, provide an update, and target
          a final response within 30 calendar days.
        </p>
      </section>
      <section>
        <h2>Escalation</h2>
        <p>
          Reply to the ticket and request escalation if the first response does not resolve
          the issue. A person not responsible for the initial response will review it where
          practical. You may still contact Safepay, your payment institution, or an
          applicable consumer authority; please give us a reasonable opportunity to
          investigate first.
        </p>
      </section>
    </>
  );
}

function PaymentsPolicy() {
  return (
    <>
      <IdentitySection />
      <section>
        <h2>Plans, price, and currency</h2>
        <p>
          Stepwise offers one-time access of 90 days for USD 20, 180 days for USD 30, and
          360 days for USD 50. There is no automatic renewal. The hosted checkout displays
          the final amount and currency before authorization. Your card issuer may apply
          exchange-rate or international-transaction charges that Stepwise does not control.
        </p>
      </section>
      <section>
        <h2>Payment processing and confirmation</h2>
        <p>
          Safepay hosts the payment interface and processes payment credentials. Stepwise
          stores an order reference, plan, amount, currency, status, and provider tracker,
          but not your full card number. A browser redirect is not proof of payment; access
          activates only after Stepwise validates Safepay’s signed server notification.
        </p>
      </section>
      <section>
        <h2>Failed, pending, duplicate, and disputed payments</h2>
        <p>
          Failed or cancelled payments do not activate access. Pending orders should not be
          paid again until support checks their status. Duplicate charges and suspected
          unauthorized use should be reported immediately. Chargebacks or reversals may
          pause the related access while the transaction is investigated.
        </p>
      </section>
      <section>
        <h2>Receipts, taxes, and records</h2>
        <p>
          A receipt identifies the plan, amount, currency, order reference, and access
          expiry. Prices include any taxes Stepwise is required to collect unless checkout
          states otherwise. Payment and entitlement records are retained for reconciliation,
          disputes, accounting, and legal compliance.
        </p>
      </section>
    </>
  );
}

function CookiesPolicy() {
  return (
    <>
      <section>
        <h2>Essential session cookie</h2>
        <p>
          Stepwise uses an Appwrite session cookie to keep signed-in requests authenticated.
          In production it is HTTP-only, secure, and same-site restricted. It is necessary
          for account and workspace operation and is removed when you sign out or the
          session expires.
        </p>
      </section>
      <section>
        <h2>Browser storage</h2>
        <p>
          Local storage protects active question-block recovery and caches synchronized
          learner state, theme, notes, cards, plan settings, and consent choices. This
          improves interruption recovery; the signed-in server record remains the source
          used across devices. You can clear site storage in your browser, though doing so
          may remove unsynchronized work.
        </p>
      </section>
      <section>
        <h2>Analytics and monitoring</h2>
        <p>
          Advertising trackers are not used. Optional product analytics and error monitoring
          remain off unless configured and disclosed. Nonessential measurement must honor
          the consent choice shown to the user. Browser settings can block storage, but core
          signed-in functions may then fail.
        </p>
      </section>
    </>
  );
}

function AccessibilityPolicy() {
  return (
    <>
      <section>
        <h2>Our commitment</h2>
        <p>
          Stepwise is working toward WCAG 2.2 Level AA across public, authentication, learner,
          and support journeys. The interface uses semantic controls, keyboard focus,
          responsive reflow, reduced-motion support, and light/dark color systems. This
          statement is a commitment, not an unverified conformance certification.
        </p>
      </section>
      <section>
        <h2>Known validation work</h2>
        <p>
          We continue manual keyboard, screen-reader, zoom, reflow, contrast, touch-target,
          form-error, and timed-session testing. Third-party hosted checkout has its own
          accessibility implementation. We prioritize barriers that prevent account access,
          question completion, purchasing, or support.
        </p>
      </section>
      <section>
        <h2>Accessibility support</h2>
        <p>
          Email <a href="mailto:support@stepwise.page">support@stepwise.page</a> with the
          page, task, browser, device, and assistive technology involved. We acknowledge
          accessibility reports within two business days and will offer a reasonable
          alternative while investigating.
        </p>
      </section>
    </>
  );
}

const documents = {
  terms: {
    title: "Terms of Service",
    intro: "The rules for using Stepwise, creating an account, and purchasing one-time educational access.",
    body: <TermsPolicy />,
  },
  privacy: {
    title: "Privacy Policy",
    intro: "What Stepwise collects, why it is needed, which providers process it, and the choices available to you.",
    body: <PrivacyPolicy />,
  },
  refunds: {
    title: "Refund & Cancellation Policy",
    intro: "Clear eligibility, request steps, decision timing, and payment-method processing expectations.",
    body: <RefundPolicy />,
  },
  delivery: {
    title: "Digital Delivery Policy",
    intro: "How a paid Stepwise access period is delivered and what to do if activation is delayed.",
    body: <DeliveryPolicy />,
  },
  complaints: {
    title: "Complaints & Resolution Policy",
    intro: "How to raise a product, content, privacy, support, or billing complaint and when to expect a response.",
    body: <ComplaintsPolicy />,
  },
  payments: {
    title: "Payment Terms",
    intro: "Plan prices, payment confirmation, provider responsibilities, receipts, and disputed transactions.",
    body: <PaymentsPolicy />,
  },
  cookies: {
    title: "Cookie & Browser Storage Policy",
    intro: "The essential session and recovery storage used by the Stepwise website and learner workspace.",
    body: <CookiesPolicy />,
  },
  accessibility: {
    title: "Accessibility Statement",
    intro: "Our current accessibility commitment, validation work, and barrier-reporting process.",
    body: <AccessibilityPolicy />,
  },
} satisfies Record<LegalDocumentType, { title: string; intro: string; body: React.ReactNode }>;

export function LegalDocument({ type }: { type: LegalDocumentType }) {
  const document = documents[type];
  const merchant = getMerchantIdentityReadiness();

  return (
    <main className="static-page">
      <header className="static-nav">
        <Logo />
        <div>
          <Link className="btn btn-secondary" href="/help">Support</Link>
          <Link className="btn btn-secondary" href="/"><ArrowLeft /> Back home</Link>
        </div>
      </header>
      <article className="static-document legal-document" aria-labelledby="legal-title">
        <div className="eyebrow"><FileText /> Stepwise policy center</div>
        <h1 id="legal-title">{document.title}</h1>
        <p className="static-updated">Effective and last updated {UPDATED}</p>
        <p className="static-intro">{document.intro}</p>
        <nav className="legal-policy-nav" aria-label="Policies">
          {policyLinks.map(([slug, label]) => (
            <Link key={slug} href={`/${slug}`} aria-current={slug === type ? "page" : undefined}>{label}</Link>
          ))}
        </nav>
        {document.body}
        <aside className={merchant.ready ? "" : "legal-review-warning"}>
          {merchant.ready ? <BadgeCheck /> : <ShieldCheck />}
          <div>
            <b>{merchant.ready ? "Published operational policy" : "Payments remain safely disabled"}</b>
            <p>
              {merchant.ready
                ? <>Questions about this policy can be sent to <a href={`mailto:${merchant.identity.legalEmail}`}>{merchant.identity.legalEmail}</a>.</>
                : <>These policies are operational drafts pending verified merchant identity and professional legal review. Contact <a href="mailto:support@stepwise.page">support@stepwise.page</a>.</>}
            </p>
          </div>
        </aside>
      </article>
    </main>
  );
}
