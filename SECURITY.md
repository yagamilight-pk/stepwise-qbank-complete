# Security policy

## Reporting a vulnerability

Do not open a public issue for a suspected vulnerability. Email
`security@stepwise.page` with the affected route or component, impact, minimal
reproduction, and a safe way to contact you. Do not include real learner data,
credentials, tokens, payment-card data, or patient information.

The team should acknowledge a valid report within two business days, establish
severity and containment, then provide a remediation timeline. Public
disclosure should wait until a fix is deployed and affected credentials or
sessions have been rotated.

## Supported version

Only the current production deployment and the current `main` branch receive
security fixes.

## Security boundaries

- Appwrite sessions use HTTP-only, secure, same-site cookies.
- Server-owned catalogs define payment amounts and access duration.
- Safepay events must pass HMAC verification and replay protection before
  access changes.
- Provider secrets belong in Vercel environment variables and must never enter
  Git, browser bundles, support tickets, or chat.
- Learner and support payloads are schema-validated and size-limited.
- Error telemetry is configured without request cookies, headers, or user PII.
