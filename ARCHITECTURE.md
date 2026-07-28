# Stepwise Frontend Architecture

## Product surfaces

Stepwise contains four deliberately distinct interfaces:

- Public product, guided sample, authentication, and legal/help surfaces
- Learner study workspace
- Medical-content and business administration workspace
- Influencer partner workspace

They share brand tokens and accessible primitives, but they must not share identical density, navigation, data exposure, or route bundles.

## Rendering model

- Static public and legal content should remain Server Components when no browser interaction is required.
- Interactive pages should place the smallest practical boundary around client behavior.
- Learner state is provided by `StepwiseProvider`, cached in browser storage, and synchronized through `/api/state` when an Appwrite account session is available.
- Appwrite email/password sessions are created by server actions and stored in HTTP-only host cookies.
- Learner route layouts require an authenticated account; admin and influencer layouts additionally enforce Appwrite user labels.
- Production entitlements and protected question-content delivery must still become server-authoritative.

## Route model

The implemented App Router structure uses route groups to keep source ownership clear without changing public URLs:

```text
src/app/
  (marketing)/        home and guided trial
  (auth)/             login, signup, onboarding, recovery
  (support)/          help and legal pages
  (learner)/app/      10 learner routes
  (admin)/admin/      9 administration routes
  (influencer)/       5 partner routes
  loading.tsx
  error.tsx
  not-found.tsx
  opengraph-image.tsx
  twitter-image.tsx
src/proxy.ts
```

Every destination has route-specific metadata. Private routes are `noindex`. The shared shells dynamically import the heavy learner, admin, and influencer implementations, so each surface loads its own chunk. `proxy.ts` rewrites the root for `app.`, `admin.`, and `influencer.` subdomains.

## State boundary

The browser store keeps the frontend resilient and usable without infrastructure. It is not an authorization or security boundary. The Appwrite integration synchronizes only learner-owned state and deliberately excludes questions, admin records, reports, partner records, and finance samples. Remaining production work must:

- Authenticate every server mutation
- Enforce role and entitlement checks server-side
- Keep admin and financial data outside learner responses and bundles
- Validate and version stored state
- Minimize personal data
- Produce immutable audit records for privileged actions

## Styling model

Styling uses four layers:

1. Semantic tokens
2. Accessible primitives
3. Product patterns
4. Surface-specific composition

New work should prefer `src/app/design-system.css` over adding unrelated rules to the legacy stylesheet.

## Performance principles

- Keep learner, admin, and influencer implementations in separate dynamic chunks
- Prefer explicit route entry points and defer heavy editors until needed
- Defer heavy editors, charts, and utilities until used
- Avoid repeated serialization across server/client boundaries
- Keep global state consumers focused
- Measure Core Web Vitals in production; build success is not field evidence
