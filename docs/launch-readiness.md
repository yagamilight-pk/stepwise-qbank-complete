# Stepwise launch readiness

Last verified: July 29, 2026

This file separates what is implemented and tested from provider, merchant, legal, and operational work that still requires a verified production account or an authorized person. It must not contain secrets, identity documents, bank records, or invented merchant details.

## Current release posture

| Area | Status | Evidence or blocker |
| --- | --- | --- |
| Production build | Passed | Next.js production build completed across 53 routes. |
| Source quality | Passed | ESLint, TypeScript, 21 unit tests, and source verification pass. |
| Production dependency audit | Passed | `npm audit --omit=dev --audit-level=moderate` reports zero vulnerabilities. |
| Development-tool dependency audit | Monitor | The full npm audit reports a high-severity `brace-expansion` advisory through ESLint/TypeScript tooling and states that no fix is available. It is not present in the production-only audit; track the upstream toolchain and avoid passing untrusted glob patterns to development commands. |
| Browser journeys | Passed locally | 92 Playwright checks passed across desktop, tablet, and mobile; 76 route/project combinations were intentionally skipped by the suite. |
| Selected landing design | Passed | The approved readiness card has a focused design comparison and a functional due-flashcards CTA. |
| Appwrite email/password auth | Provider path verified | Disposable live-provider smoke proved account creation, email/password session creation, session-cookie secret availability, authenticated account reads, verification requests, and recovery requests. |
| Appwrite session key | Configured | The server key includes the required `sessions.write` scope. Keep it server-only and rotate it on the normal key schedule. |
| Appwrite custom email delivery | Blocked | Custom SMTP is not configured. Inbox delivery and branded verification/recovery messages are therefore not launch-verified. |
| Resend transactional email | Blocked | A verified `stepwise.page` sending domain and production `RESEND_API_KEY` are required. |
| Learner cloud data | Implemented | Authenticated learner state uses Appwrite; anonymous demo routes stay local and no longer generate failed cloud-sync requests. |
| Support requests | Implemented, delivery-gated | Tickets persist through the server-side Appwrite path. Notification delivery requires Resend. The UI provides the support email fallback. |
| Safepay checkout | Safely disabled | Checkout and webhook flags remain off. Merchant identity, Safepay credentials, and the sandbox payment matrix are incomplete. |
| Public policies | Drafted and routed | Terms, privacy, payments, refunds, delivery, complaints, cookies, and accessibility pages are linked and responsive. They remain operational drafts until verified merchant facts and professional review are supplied. |
| Admin operations | Demo-only | The UI explicitly labels local demo operations. A production content/admin backend and immutable audit history are still required. |
| Partner portal | Fails safely | Shared/local passwords were removed. Access now requires Appwrite authentication, an influencer label, and a provisioned server-side partner profile. That profile/ledger workflow is not yet implemented. |
| Monitoring | Optional but recommended | Sentry remains inactive until its production DSN and release credentials are configured. |

## Production activation gates

Do not enable payments or enforce paid entitlements until every gate below is complete.

1. Supply verified merchant facts in the production environment:
   - legal business name
   - registration type and registration number
   - NTN or tax registration number
   - registered address
   - operating address
   - public customer-support phone
2. Verify `stepwise.page` in Resend, publish the required DNS records, and send a deliverability test to at least Gmail, Outlook, and a university mailbox.
3. Configure Resend SMTP in Appwrite and apply the committed verification and recovery templates.
4. Confirm verification and recovery links work once, expire correctly, and land on the intended `stepwise.page` routes.
5. Complete Safepay production onboarding and obtain authorized sandbox/live credentials outside the repository.
6. Run the sandbox matrix for success, failure, cancellation, pending, duplicate event, replay, out-of-order event, refund, chargeback, and reconciliation.
7. Have Pakistani counsel review the public policy set against the verified entity, tax treatment, consumer obligations, content licensing, and operating model.
8. Configure monitoring, a status page, backup/restore ownership, incident contacts, and key-rotation ownership.
9. Replace demo-only admin and partner workflows with server-enforced roles, immutable audit events, and production data.
10. Run the final browser, accessibility, email-inbox, payment, and disaster-recovery checks against the production deployment.

## Email activation checklist

- Sender: `Stepwise <noreply@stepwise.page>`
- Reply-to: `support@stepwise.page`
- Appwrite templates: `appwrite/email-templates/verification.html` and `appwrite/email-templates/recovery.html`
- Application transactional messages: welcome, support acknowledgement, purchase receipt, refund acknowledgement, refund decision, and access-expiry reminder
- Required evidence:
  - SPF/DKIM visible as verified
  - DMARC policy published and monitored
  - inbox and spam-folder results recorded
  - mobile rendering checked
  - one-time/expired link behavior checked
  - no secret or password appears in a message or log

## Release decision

The repository is suitable for continued staging and provider integration. It is not yet suitable for accepting live payments because merchant identity, custom email delivery, Safepay onboarding, the payment matrix, and professional policy review are unresolved. The application intentionally fails closed for those capabilities.
