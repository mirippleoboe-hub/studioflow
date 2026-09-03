# Cloud storage setup

StudioFlow includes OAuth connection, token refresh, file listing, uploads, private material records, and authenticated studio downloads for Google Drive, OneDrive and Dropbox. These integrations require developer applications owned by the studio operator. Installing a connector in ChatGPT does not configure StudioFlow's OAuth applications.

Until configured, Materials shows “Administrator setup required”. StudioFlow's own private storage works independently. No cloud account has been connected or live-tested yet.

## Shared server configuration

Set these in Vercel Preview for the current preview app and in a separate production environment when ready:

- `CLOUD_TOKEN_KEY`: a random 32-byte key encoded as base64, used for AES-256-GCM encryption of OAuth tokens. Generate with `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`. Keep it stable; replacing it requires reconnecting cloud accounts.
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase server credential. Used only after the viewer's RLS-authorized material lookup to retrieve/refresh the owner's encrypted cloud connection for shared downloads. Never prefix this with NEXT_PUBLIC or commit it.
- `NEXT_PUBLIC_SITE_URL`: the canonical app origin. OAuth must start from this origin so the state cookie returns to the same host.

Callback URLs below use the current canonical preview origin:
`https://studioflow-git-codex-restore-05e924-mirippleoboe-hubs-projects.vercel.app`

## Google Drive

1. Create a Google Cloud project, enable Drive API, configure its OAuth consent screen and test users, and create a Web application OAuth client.
2. Register `/api/cloud/google/callback` on the canonical origin as an authorized redirect URI.
3. Set `GOOGLE_DRIVE_CLIENT_ID` and `GOOGLE_DRIVE_CLIENT_SECRET`.
4. The app requests `https://www.googleapis.com/auth/drive.file` with offline access. This intentionally exposes files created through StudioFlow; it does not browse the user's entire Drive. Google native documents are exported as PDF when downloaded.
5. Google's external app publishing/verification and test-mode token lifetimes may apply. Review provider console requirements before wider rollout.

Reference: https://developers.google.com/identity/protocols/oauth2/web-server
Uploads: https://developers.google.com/workspace/drive/api/guides/manage-uploads

## OneDrive

1. Register an application in Microsoft Entra ID supporting organizational directories and personal Microsoft accounts (the adapter uses the `common` tenant).
2. Add a Web redirect URI ending `/api/cloud/onedrive/callback`.
3. Add delegated Microsoft Graph `Files.ReadWrite` and offline access consent as appropriate, then create a client secret.
4. Set `ONEDRIVE_CLIENT_ID` and `ONEDRIVE_CLIENT_SECRET`.

Reference: https://learn.microsoft.com/en-us/graph/auth-v2-user
Uploads: https://learn.microsoft.com/en-us/graph/api/driveitem-put-content?view=graph-rest-1.0

## Dropbox

1. Create a scoped Dropbox API app. Choose App folder access for a dedicated StudioFlow folder, or Full Dropbox if root-file browsing is desired.
2. Enable `files.metadata.read`, `files.content.read`, and `files.content.write` permissions.
3. Register a redirect URI ending `/api/cloud/dropbox/callback`.
4. Set `DROPBOX_CLIENT_ID` to the app key and `DROPBOX_CLIENT_SECRET` to the app secret.

Reference: https://developers.dropbox.com/oauth-guide

## Finish and verify

Redeploy after adding variables. In Materials, connect each provider, grant consent, upload a small file, add it privately, then explicitly Share with studio. Verify download as another active member and denial as an outsider. Test making it private again and disconnecting. Disconnect removes encrypted credentials and corresponding material records from StudioFlow; original provider files remain. Users can revoke provider authorization in the provider's account settings.

Current limits: cloud uploads up to 3 MB (to stay below Vercel request limits); StudioFlow direct uploads up to 20 MB. Cloud browsing displays up to 100 root files (OneDrive/Dropbox) or app-created files (Google). Folder navigation and pagination are not included. Provider permissions are never made public: shared cloud downloads pass through an authenticated StudioFlow route. Native storage downloads use 60-second signed URLs.
