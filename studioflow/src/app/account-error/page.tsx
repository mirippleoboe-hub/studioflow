import { signOutAction } from "@/app/(app)/actions";
import { Button } from "@/components/ui/button";

export default function AccountErrorPage() {
  return <main className="mx-auto max-w-xl space-y-5 px-6 py-20">
    <h1 className="text-2xl font-semibold">Your studio account needs attention</h1>
    <p>We could not load your profile or studio. Ask the studio administrator to check the Supabase connection and database migrations, then try again.</p>
    <form action={signOutAction}><Button type="submit">Sign out and try again</Button></form>
  </main>;
}
