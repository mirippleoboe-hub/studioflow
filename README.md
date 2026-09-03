# StudioFlow

The Next.js app lives in **`studioflow/`**, one level below this repository root.

```sh
cd studioflow
npm ci
cp .env.example .env.local
npm run dev
```

Fill in the Supabase configuration before signing in. See [the app setup guide](studioflow/README.md) for database migrations, authentication, verification, and Vercel deployment.

**Vercel Root Directory must be `studioflow`.** Use the Next.js framework preset.
