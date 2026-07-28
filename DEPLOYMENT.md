# Appwrite and Vercel deployment

Last updated: July 28, 2026

## Current connection status

- Vercel project: `yagamilight-pks-projects/stepwise-qbank-complete`
- GitHub repository: `yagamilight-pk/stepwise-qbank-complete`
- Vercel project and GitHub connection: complete
- Canonical production URL: `https://stepwise.page`
- Marketing hosts: `stepwise.page`, `www.stepwise.page`
- Protected entry hosts: `app.stepwise.page`, `admin.stepwise.page`
- Stable Vercel fallback: `stepwise-qbank-complete.vercel.app`
- Appwrite project: `stepwise-qbank-complete` in the GitHub Student organization
- Appwrite region: Frankfurt (`fra`)
- Appwrite application integration and resource provisioning: complete
- Vercel environment variables: configured for Production, Preview, and Development
- Production dependency audit: zero findings; the development-only ESLint
  dependency tree still carries an upstream minimatch/brace-expansion advisory

The previous Vercel project `yagamilight-pks-projects/stepwise` remains
available, but the apex, `www`, `app`, and `admin` domains were transferred to
`stepwise-qbank-complete` on July 28, 2026.

## Appwrite resource contract

The isolated Appwrite Cloud project `Stepwise QBank` contains:

- Project ID: `stepwise-qbank-complete`
- Database ID: `stepwise`
- Table ID: `user_states`
- Row security: enabled
- Table create permission: authenticated users
- Columns:
  - `schemaVersion`: required integer
  - `state`: required longtext
- Web platforms:
  - `localhost`
  - `stepwise-qbank-complete.vercel.app`
  - `stepwise.page`
  - `www.stepwise.page`
  - `app.stepwise.page`
  - `admin.stepwise.page`
- Enabled authentication methods:
  - Email/password
  - JWT

Magic URL, email OTP, anonymous, invitation, and phone authentication are
disabled. OAuth providers, including Google, were not configured or modified.

Every learner-state row uses the Appwrite user ID as its row ID. Row permissions
grant read, update, and delete only to that user. The browser never receives an
Appwrite API key.

## Runtime environment

Vercel Production, Preview, and Development contain:

```text
NEXT_PUBLIC_AUTH_PROVIDER=appwrite
APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=stepwise-qbank-complete
APPWRITE_DATABASE_ID=stepwise
APPWRITE_USER_STATE_TABLE_ID=user_states
```

`NEXT_PUBLIC_SITE_URL` is `https://stepwise.page` in Production and
`http://localhost:3000` in Development. Preview intentionally derives its
origin from the request host so recovery links remain on the active preview.

`APPWRITE_*` values are server-only. No long-lived Appwrite API key is required
by the application runtime.

## Implemented application boundary

- Email/password signup and login use Appwrite server sessions.
- The session secret is stored in an HTTP-only, secure, same-site host cookie.
- Learner routes require an authenticated Appwrite account when provider
  variables are configured.
- Admin and influencer routes additionally require the `admin` and `influencer`
  Appwrite user labels.
- Password recovery uses Appwrite recovery links.
- Learner progress synchronizes through `/api/state`.
- `/api/health` checks Appwrite reachability without exposing project details.

Only learner-owned progress is synchronized: attempts, notes, flashcards,
bookmarks, flags, sessions, study-plan data, preferences, profile data, saved
articles, and library activity. Bundled question content, demonstration admin
records, reports, partner records, and finance data are not uploaded.

## Verification boundary

The provider configuration, schema, row permissions, registered hosts, local
source audit, lint, typecheck, production build, and production dependency
audit are verified. Hosted checks returned `200` for the apex, `www`, app/admin
login pages, and Appwrite health. Unauthenticated app/admin roots returned
host-local `307` redirects with safe `/app` and `/admin` return targets. A real
signed-in learner session and email delivery require an account-owner browser
check; no disposable production user is created by automation.
