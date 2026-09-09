# Authentication email delivery

StudioFlow uses Supabase Auth for account confirmation and password-reset emails. The hosted project sends those messages through Resend so new users are not limited by Supabase's default trial mail service.

## Current hosted configuration

- Sending domain: `auth.studioflowapp.io`
- Visible sender: `StudioFlow <no-reply@auth.studioflowapp.io>`
- SMTP host: `smtp.resend.com`
- SMTP port: `465`
- SMTP username: `resend`
- SMTP password: a Resend API key stored only in the Supabase SMTP settings
- Application site URL: `https://www.studioflowapp.io`
- Confirmation callback: `https://www.studioflowapp.io/auth/callback`

The Squarespace DNS zone contains Resend's DKIM and return-path records for the `auth` subdomain. Resend must show the domain as **Verified** before sending from the address above.

## Secret handling and rotation

Never commit the Resend API key to this repository or place it in a public client environment variable. If the key is replaced, create a sending-only key in Resend and update the password in **Supabase → Authentication → Emails → SMTP Settings**.

## Verification checklist

1. Open `/signup` on the live site and create an account with an inbox you can access.
2. Confirm that Resend's Emails page records the delivery.
3. Open the confirmation link and verify it returns to `/auth/callback` on `www.studioflowapp.io`.
4. Complete the teacher or student onboarding flow and sign in again.

