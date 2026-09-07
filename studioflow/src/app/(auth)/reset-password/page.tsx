import { updatePasswordAction } from "@/app/(auth)/actions";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ResetPasswordPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const params = await searchParams;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Choose a new password</CardTitle>
        <CardDescription>Use at least eight characters.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={updatePasswordAction} className="space-y-4">
          {params.error ? <Alert>{params.error}</Alert> : null}
          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <Input id="password" name="password" type="password" minLength={8} autoComplete="new-password" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password_confirmation">Confirm new password</Label>
            <Input id="password_confirmation" name="password_confirmation" type="password" minLength={8} autoComplete="new-password" required />
          </div>
          <Button className="w-full" type="submit">Update password</Button>
        </form>
      </CardContent>
    </Card>
  );
}
