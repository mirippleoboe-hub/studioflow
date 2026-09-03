"use client";
import { useState, useTransition, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
export type ActionResult = { error?: string; message?: string };
export function ActionForm({ action, children, label = "Save", className = "space-y-4" }: {
  action: (state: ActionResult, data: FormData) => Promise<ActionResult>;
  children: ReactNode;
  label?: string;
  className?: string;
}) {
  const [state, setState] = useState<ActionResult>({});
  const [pending, start] = useTransition();
  return <form className={className} onSubmit={event => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    start(async () => {
      setState({});
      try { setState(await action({}, data)); }
      catch { setState({ error: "Unable to save. Please try again." }); }
    });
  }}>
    <fieldset disabled={pending} className="space-y-4">{children}</fieldset>
    <Button disabled={pending} type="submit">{pending ? "Saving…" : label}</Button>
    {state.error && <p role="alert" className="text-sm text-destructive">{state.error}</p>}
    {state.message && <p role="status" className="text-sm text-muted-foreground">{state.message}</p>}
  </form>;
}
