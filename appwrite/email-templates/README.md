# Stepwise Appwrite authentication email templates

These are the production-ready source templates for the two Appwrite Auth emails
currently used by Stepwise.

## Sender settings

- From name: `Stepwise`
- From address: `noreply@stepwise.page`
- Reply-to: `support@stepwise.page`
- Verification subject: `Verify your Stepwise email`
- Recovery subject: `Reset your Stepwise password`

## Activation

1. Verify `stepwise.page` in Resend with SPF and DKIM.
2. Configure Resend SMTP for the Appwrite project.
3. In Appwrite Console, open **Auth → Settings → Email templates**.
4. Paste `verification.html` into the verification template and
   `recovery.html` into the recovery template.
5. Preserve Appwrite variables exactly. `{{redirect}}` is the signed,
   time-limited action URL; `{{user}}` and `{{project}}` are escaped by the
   provider before substitution.
6. Send both messages to a disposable inbox and verify desktop, mobile, expiry,
   and one-time-use behavior before production activation.

The application already requests verification at signup and password recovery
from `/forgot-password`. Custom templates will not be used until custom SMTP is
enabled in Appwrite.
