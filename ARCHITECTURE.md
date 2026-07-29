# Stepwise architecture

## Product surfaces

Stepwise contains separate public, learner, administration, and partner
surfaces. Shared visual primitives do not imply shared authorization. Learner
routes require an Appwrite session; admin and partner routes require labels;
paid learner access can be enforced server-side after provider validation.

## Runtime flow

```text
Browser
  -> Next.js Server Components and server actions
      -> Appwrite Auth (session, verification, recovery)
      -> Appwrite TablesDB (normalized learner and operational records)
      -> Resend API (welcome, support, receipts)
      -> Safepay hosted checkout + signed webhook
      -> Sentry (PII-reduced error telemetry)
```

The secure Appwrite session secret remains in an HTTP-only, secure, strict
same-site cookie. Provider keys remain server-only.

## Learner data

The browser store is a recoverable cache, not an authority. `/api/state`
validates a strict versioned Zod payload, caps its size, and uses revision
conflict checks. The snapshot preserves compatibility while every save also
normalizes:

- profile and preferences;
- immutable server-verified attempts;
- sessions;
- notes, flashcards, study tasks, bookmarks, flags, article activity;
- tombstones for deleted artifacts.

Attempts use deterministic row IDs so retries do not duplicate evidence.
Unknown or untrusted question keys are retained for learner history but marked
ineligible for scoring evidence.

## Psychometrics and adaptation

`src/lib/psychometrics.ts` implements:

- Rasch response probability and item information;
- EAP learner ability with a standard-normal prior and posterior standard error;
- time-decayed beta-binomial mastery;
- p-value, corrected point-biserial, upper/lower discrimination, distractor
  efficiency, timing, and confidence item statistics;
- an operational minimum of 30 independent learners;
- adaptive ranking by information, mastery gap, recency, exposure, and
  confidence repair.

The daily authenticated aggregation job writes item and mastery records.
Imported response percentages are displayed only when a source provides a
complete distribution. Cohort percentiles remain withheld until a real,
privacy-safe comparable sample exists.

## Commerce

The server owns the only valid catalog: 90 days/$20, 180 days/$30, and 360
days/$50. Purchases do not renew automatically. Checkout creates an order
before calling Safepay. A signed, replay-protected webhook verifies the
server-owned amount and extends access. Refund and chargeback events revoke
access and the subscriber label. Failed mutations enter reconciliation state.

## Support and email

The support page creates tracked Appwrite tickets after schema validation,
payload limits, a honeypot/time check, and per-email rate limiting. Resend sends
acknowledgement and operator notification messages when configured.

Appwrite owns verification and recovery tokens. Its custom SMTP should use
Resend so those authentication emails also originate from
`noreply@stepwise.page`. The application sends welcome, support, and receipt
messages through Resend’s API with idempotency keys.

## Reliability and assurance

- liveness and dependency-readiness endpoints;
- structured redacted audit events;
- Sentry with request headers, cookies, and user PII removed;
- Vitest unit coverage gates;
- source contracts, ESLint, TypeScript, and production build gates;
- GitHub Actions CI, CodeQL, and Dependabot;
- daily authenticated psychometric aggregation;
- explicit provider feature flags that default to off.

## Known launch boundaries

- The new Appwrite schema and secrets must be provisioned before deployment.
- The Appwrite Education benefit cannot be assumed to allow commercial use.
- Bundled demonstration questions are not protected commercial inventory.
- Final policies need legal review.
- Provider delivery, real-device accessibility, payment reconciliation, and
  production observability require staged evidence; source code alone does not
  prove them.
