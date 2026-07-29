# Safepay merchant onboarding checklist

Last reviewed against Safepay guidance: July 29, 2026

This checklist prepares the Stepwise application and supporting business material for Safepay review. It is not an approval promise or legal advice. Never commit CNIC images, bank certificates, API secrets, tax documents, or other private onboarding records to this repository.

## 1. Verified business profile

- [ ] Brand/trading name: Stepwise
- [ ] Exact legal business name
- [ ] Registration type
- [ ] Registration number
- [ ] NTN/tax number
- [ ] Date business activity began
- [ ] Staff size
- [ ] Industry/category selected for the education software service
- [ ] Short business description that matches the public website
- [ ] Registered Pakistani business address
- [ ] Operating address, if different
- [ ] Public support phone
- [ ] General account email
- [ ] Support email: `support@stepwise.page`
- [ ] Disputes/billing email: `billing@stepwise.page`
- [ ] Online presence: `https://stepwise.page`

Once verified, mirror the exact public fields into the production environment variables documented in `.env.example`. The website and Safepay submission must use the same facts.

## 2. Product and transaction description

Proposed product description for review:

> Stepwise is a web-based medical examination preparation platform. Customers purchase one-time, time-limited access to a digital QBank, study planning, flashcards, notes, and learning analytics. No physical goods are shipped and plans do not renew automatically.

Current public offers:

| Access | Price | Renewal | Delivery |
| --- | ---: | --- | --- |
| 90 days | USD 20 | None | Digital account entitlement |
| 180 days | USD 30 | None | Digital account entitlement |
| 360 days | USD 50 | None | Digital account entitlement |

Complete before submission:

- [ ] Confirm Safepay accepts the displayed USD pricing and intended customer geography.
- [ ] State target customer countries.
- [ ] Estimate monthly transaction count.
- [ ] State minimum, maximum, and average transaction size.
- [ ] Explain that delivery is a server-side account entitlement after a signed payment confirmation.
- [ ] Describe how delivery, cancellation, refunds, and complaints are handled.
- [ ] Prepare prior business evidence or portfolio material if requested.

## 3. Individuals and bank material

Collect and submit only through Safepay's authorized production onboarding flow:

- [ ] CNIC front/back for directors, governing-board members, individuals owning at least 10%, and anyone with significant management control
- [ ] Business bank account details
- [ ] Bank maintenance certificate
- [ ] NTN/tax evidence
- [ ] Registration-type-specific business documents
- [ ] Beneficial ownership/control information
- [ ] Authorized onboarding contact

## 4. Public website review

Implemented routes:

- [x] Terms of Service: `/terms`
- [x] Privacy Policy: `/privacy`
- [x] Payment Terms: `/payments`
- [x] Refund & Cancellation Policy: `/refunds`
- [x] Digital Delivery Policy: `/delivery`
- [x] Complaints & Resolution Policy: `/complaints`
- [x] Cookie & Browser Storage Policy: `/cookies`
- [x] Accessibility Statement: `/accessibility`
- [x] Support form and contact route: `/help`
- [x] Clear packages, prices, currency, duration, and no-renewal statement
- [x] Working checkout terms links
- [x] No customer card details handled by Stepwise
- [ ] Exact public legal entity and addresses populated
- [ ] Public support phone populated
- [ ] Professional review completed
- [ ] Production link checker completed
- [ ] All claims, content rights, and testimonials substantiated

## 5. Published operating promises

The current draft policies state:

- digital access normally activates within minutes after a valid signed confirmation;
- customers should contact support if paid access is not active within 24 hours;
- refund requests are accepted within seven calendar days when fewer than 50 paid-period questions were attempted, subject to stated exceptions and mandatory rights;
- refund requests are acknowledged within two business days and decided within seven business days;
- an approved refund can take up to ten additional business days at the provider/bank;
- complaints are acknowledged within two business days, normally resolved within ten business days, and targeted for a final response within 30 calendar days when complex;
- plans are one-time purchases and do not renew automatically.

These promises must be approved by the business owner, staffed operationally, and reviewed professionally before the site represents them as final policies.

## 6. Technical approval gates

- [ ] Safepay sandbox API key stored only in approved environment-secret storage
- [ ] Webhook secret stored only in approved environment-secret storage
- [ ] Hosted checkout session created server-side
- [ ] Raw webhook body verified against Safepay's signature
- [ ] Browser return never treated as payment confirmation
- [ ] Payment event IDs are idempotent
- [ ] Replay and out-of-order events tested
- [ ] Duplicate checkout/payment behavior tested
- [ ] Refund and chargeback entitlement behavior tested
- [ ] Reconciliation job and alert ownership assigned
- [ ] Receipt and refund emails inbox-tested
- [ ] Checkout and webhook feature flags enabled only after sign-off

## 7. Submission packet

- [ ] Safepay onboarding form completed
- [ ] Business profile and transaction estimates approved
- [ ] Private documents uploaded through Safepay
- [ ] Public production website available for review
- [ ] Policy routes and public contact information verified
- [ ] Sandbox evidence attached internally
- [ ] Named owner assigned for Safepay follow-up
- [ ] Final application copy retained in secure company records
