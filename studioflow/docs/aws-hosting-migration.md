# AWS hosting migration

StudioFlow uses AWS Amplify Hosting for its Next.js web application and keeps Supabase for authentication, PostgreSQL, and file storage. The Vercel preview should remain available until the AWS deployment passes the checks below.

## AWS Amplify setup

1. Open AWS Amplify and choose **Create new app**.
2. Choose **GitHub**, then authorize access to `mirippleoboe-hub/studioflow` if prompted.
3. Select repository `mirippleoboe-hub/studioflow` and branch `codex/restore-functional-mvp` for the first AWS preview.
4. Select **My app is a monorepo** and enter `studioflow` as the app root.
5. Confirm that Amplify finds `amplify.yml`, uses Node.js 22, runs `npm ci` and `npm run build`, and publishes `.next`.
6. Add the public environment variables below before deploying.

| Variable | Value |
| --- | --- |
| `AMPLIFY_MONOREPO_APP_ROOT` | `studioflow` |
| `NEXT_PUBLIC_SUPABASE_URL` | The existing StudioFlow Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | The existing StudioFlow Supabase publishable key |
| `NEXT_PUBLIC_SITE_URL` | The AWS branch URL after the first deployment |

If the site uses the legacy Supabase anon key instead, set `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Never add a Supabase service-role key to a `NEXT_PUBLIC_*` variable.

The first deployment can temporarily use the Amplify-generated URL for `NEXT_PUBLIC_SITE_URL`. After that URL is known, update the value and redeploy so authentication emails return to AWS.

## Supabase authentication URLs

After AWS provides the branch URL, add these entries in Supabase **Authentication → URL Configuration**:

- Site URL: the final AWS or custom-domain origin
- Redirect URL: `https://YOUR-AWS-DOMAIN/auth/callback`

Keep the existing Vercel callback during verification. Remove it only after the AWS deployment is accepted as the primary site.

## Verification before switching traffic

1. Sign in as the existing teacher and open Dashboard, Students, Scheduling, Assignments, Messages, Materials, Profile, and Settings.
2. In a separate session, sign in as the test student and confirm the student-specific views.
3. Create and remove a temporary calendar event and assignment.
4. Upload and remove a temporary material or profile photo.
5. Confirm Supabase email links return to the AWS URL.
6. Review the Amplify build and server logs for errors.

Connect a custom domain only after these checks pass. Keep Vercel active during the first AWS verification and switch the domain after the AWS version is stable.
