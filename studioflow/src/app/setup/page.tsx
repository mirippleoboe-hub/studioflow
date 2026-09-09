import { redirect } from "next/navigation";
import { getSupabaseConfig } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

export default function SetupPage() {
  if (getSupabaseConfig()) redirect("/login");
  return (
    <main className="mx-auto max-w-xl space-y-5 px-6 py-20">
      <p className="text-sm font-medium text-primary">StudioFlow</p>
      <h1 className="text-3xl font-semibold">Connect your studio</h1>
      <p>The app is installed. Connect Supabase to enable accounts and save your studio’s work.</p>
      <ol className="list-decimal space-y-3 pl-5 text-sm text-muted-foreground">
        <li>Copy .env.example to .env.local and add your Supabase project URL and publishable key.</li>
        <li>Apply all four database migrations in order, from 0001 through 0004.</li>
        <li>Configure your email confirmation URL and restart the app.</li>
      </ol>
      <p className="text-sm">For Vercel, add the environment variables in project settings and redeploy. Full instructions are in the project README.</p>
    </main>
  );
}
