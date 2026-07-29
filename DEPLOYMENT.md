# Appwrite, Resend, Safepay, and Vercel deployment

Last updated: July 29, 2026

## Current status

The application code and infrastructure contract are implemented. This
worktree is linked to Vercel project
`yagamilight-pks-projects/stepwise-qbank-complete`, with `stepwise.page`,
`www.stepwise.page`, `app.stepwise.page`, and `admin.stepwise.page` active as
the public hosts. Production deployment `dpl_FkSbPSHAtvssPba2AVa2vyAxTf8E`
is READY and all four hosts resolve to the current hardened release.

The Appwrite data contract is live in project `stepwise-qbank-complete`:
14 tables, 134 available columns, and 22 available indexes match
`appwrite.config.json`. A repeat push reports no schema changes. Email/password
auth is enabled; password-dictionary and personal-data checks, session alerts,
session invalidation, and a 10-session limit are active. All four Stepwise
hosts, the Vercel hostname, and localhost are registered web platforms.

The time-limited Appwrite Production server key is stored only in Vercel's
encrypted Production environment. It expires July 29, 2027 and has exactly
`rows.read`, `rows.write`, `users.read`, and `users.write`. Appwrite SMTP is
still disabled, so branded authentication delivery remains a commercial-launch
gate.

Vercel now contains the non-secret pricing, sender identity, sandbox provider
mode, and fail-closed payment flags for Production, Preview, and Development.
Production also has a generated `CRON_SECRET`. Server credentials remain
deliberately absent and must be entered directly in Vercel.

The current Appwrite Education benefit is documented by the provider as
non-commercial. A paid production launch therefore requires a commercial
Appwrite plan or written permission that covers this use.

## Appwrite data contract

`appwrite.config.json` declares:

- legacy learner snapshot storage with revision and checksum conflict control;
- learner profiles, immutable verified attempts, sessions, artifacts, and
  Bayesian mastery rows;
- subscriptions, server-owned orders, payment-event replay ledger;
- support tickets, email-delivery events, and redacted audit events;
- item statistics and versioned question records.

Row security grants learners read access to their own records. All normalized
writes use the server API key; that key must never enter a browser environment
variable. Attempts are scored against a server-owned answer key before they
become psychometric evidence.

## Required environment variables

Use Vercel environment variables rather than committing values. The complete
template is in `.env.example`.

Required for identity and normalized storage:

```text
NEXT_PUBLIC_AUTH_PROVIDER=appwrite
APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=stepwise-qbank-complete
APPWRITE_DATABASE_ID=stepwise
APPWRITE_USER_STATE_TABLE_ID=user_states
APPWRITE_API_KEY=<least-privilege server key>
```

Required for transactional email:

```text
RESEND_API_KEY=<server-only>
EMAIL_FROM=Stepwise <noreply@stepwise.page>
EMAIL_REPLY_TO=support@stepwise.page
SUPPORT_INBOX_EMAIL=support@stepwise.page
```

Required before payment can be enabled:

```text
SAFEPAY_ENVIRONMENT=sandbox
SAFEPAY_API_KEY=<server-only sandbox key>
SAFEPAY_WEBHOOK_SECRET=<server-only signing secret>
PAYMENT_CURRENCY=USD
STEPWISE_90_PRICE_CENTS=2000
STEPWISE_180_PRICE_CENTS=3000
STEPWISE_360_PRICE_CENTS=5000
ENABLE_SAFEPAY_CHECKOUT=false
ENABLE_SAFEPAY_WEBHOOK=false
ENFORCE_SUBSCRIPTIONS=false
```

Reliability:

```text
CRON_SECRET=<random value of at least 16 characters>
SENTRY_DSN=<server DSN>
NEXT_PUBLIC_SENTRY_DSN=<browser DSN>
SENTRY_ORG=
SENTRY_PROJECT=
SENTRY_AUTH_TOKEN=<build-only source-map upload token>
```

Keep all three payment flags `false` until sandbox purchase, signed webhook,
duplicate delivery, refund/chargeback, expiry, and reconciliation tests pass.

## Completed Appwrite activation

- [x] Authenticated the Appwrite CLI and upgraded it to 24.0.0.
- [x] Confirmed the linked FRA project and `stepwise` TablesDB database.
- [x] Pushed and inspected every declared table, column, index, and platform.
- [x] Repeated the table push with no changes detected.
- [x] Applied the declared authentication security policies.
- [x] Transferred a time-limited, four-scope server key directly to encrypted
  Vercel Production storage without printing or writing the secret locally.
- [x] Deployed to Vercel Production with checkout, webhook, and entitlement
  enforcement disabled.
- [x] Verified all four custom hosts, protected-host redirects, Appwrite
  readiness, plan rendering, support, and CSP/frame protections in production.

## Remaining activation sequence

1. Confirm the linked project is approved for the intended commercial use.
2. Verify `stepwise.page` in Resend. Add the exact DNS records Resend supplies.
3. Configure Appwrite custom SMTP with Resend:
   `smtp.resend.com`, username `resend`, password equal to a restricted Resend
   API key, and TLS on port 465 or STARTTLS on 587. Set sender
   `noreply@stepwise.page` and reply-to `support@stepwise.page`.
4. Customize Appwrite verification and password-recovery templates. Those
   built-in authentication emails use Appwrite tokens and the configured
   Resend SMTP path; welcome, support, and receipt emails use the Resend API.
5. Add Safepay sandbox credentials and register
   `/api/webhooks/safepay` with the matching signing secret.
6. Run a disposable-user test for signup, verification, recovery, learner
    sync/conflict, support email, checkout, replay, refund, and expiry.
7. Enable checkout and webhook in staging. Enable entitlement enforcement
    last. Production requires the commercial/legal gate above.

## Operational behavior

- `/api/health` is a dependency-free liveness check.
- `/api/health?ready=1` fails closed when Appwrite/admin access or an enabled
  payment integration is incomplete.
- `/api/jobs/psychometrics` accepts only Vercel Cron’s bearer secret, aggregates
  server-verified responses, and withholds operational item statistics below
  30 independent learners.
- Payment access changes only after a signed Safepay webhook. Browser return
  URLs never activate access.
- Email and payment deliveries use deterministic event IDs for replay control
  and auditability.

## Release gate

Before production:

```bash
npm ci
npm run audit
npm run security:audit
```

Then verify a Vercel preview, inspect Sentry redaction, complete manual keyboard
and screen-reader checks, and retain evidence for the sandbox payment and email
flows. Local success is not proof of provider delivery.
