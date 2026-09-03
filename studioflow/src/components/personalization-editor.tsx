"use client";

import Link from "next/link";
import { useState, useTransition, type CSSProperties } from "react";
import { ArrowUp, ArrowDown, Check, RotateCcw } from "lucide-react";
import { savePersonalization } from "@/app/(app)/settings/personalization/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { defaultPersonalization, menuItems, palettes, themeStyle, type Personalization, type MenuId } from "@/lib/personalization";

export function PersonalizationEditor({ initial }: { initial: Personalization }) {
  const [draft, setDraft] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  function change(next: Personalization) { setDraft(next); setMessage(""); setError(""); }
  function move(id: MenuId, direction: number) {
    const order = [...draft.menuOrder];
    const from = order.indexOf(id), to = from + direction;
    if (to < 0 || to >= order.length) return;
    [order[from], order[to]] = [order[to], order[from]];
    change({ ...draft, menuOrder: order });
    setMessage(`${menuItems.find(item => item.id === id)?.label} moved to position ${to + 1}.`);
  }
  function save() {
    startTransition(async () => {
      try {
        const result = await savePersonalization(draft);
        if (result.error || !result.preferences) { setError(result.error ?? "Please try again."); return; }
        setSaved(result.preferences);
        setDraft(result.preferences);
        setMessage("Your preferences are saved.");
        setError("");
      } catch { setError("We couldn't save your preferences. Please try again."); }
    });
  }
  return (
    <div className="space-y-6">
      <Link className="text-sm text-muted-foreground hover:underline" href="/settings">← Settings</Link>
      <PageHeader title="Make it yours" description="Choose your colors and put your most-used pages within easy reach. These settings apply only to your account." />
      <div className="grid items-start gap-6 xl:grid-cols-[1fr_260px]">
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Colors</CardTitle><CardDescription>A little color, with the same clean workspace.</CardDescription></CardHeader>
            <CardContent>
              <fieldset disabled={pending} className="flex flex-wrap gap-3">
                <legend className="sr-only">Color palette</legend>
                {Object.entries(palettes).map(([id, palette]) => (
                  <label key={id} className="relative flex cursor-pointer flex-col items-center gap-2 rounded-lg border p-3 has-[:checked]:border-primary has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring">
                    <input className="sr-only" type="radio" name="palette" value={id} checked={draft.palette === id} onChange={() => change({ ...draft, palette: id as Personalization["palette"] })} />
                    <span className="flex h-9 w-9 items-center justify-center rounded-full text-white" style={{ backgroundColor: `hsl(${palette.primary})` }}>
                      {draft.palette === id && <Check aria-hidden="true" className="h-4 w-4" />}
                    </span>
                    <span className="text-sm">{palette.name}</span>
                  </label>
                ))}
              </fieldset>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Menu order</CardTitle><CardDescription>Move pages up or down to match the way you teach.</CardDescription></CardHeader>
            <CardContent>
              <ol className="divide-y rounded-lg border">
                {draft.menuOrder.map((id, index) => {
                  const item = menuItems.find(item => item.id === id)!;
                  return <li key={id} className="flex items-center gap-3 px-3 py-2">
                    <span className="w-5 text-xs tabular-nums text-muted-foreground" aria-hidden="true">{index + 1}</span>
                    <span className="flex-1 text-sm font-medium">{item.label}</span>
                    <Button type="button" variant="ghost" disabled={pending || index === 0} aria-label={`Move ${item.label} up`} onClick={() => move(id, -1)}><ArrowUp aria-hidden="true" className="h-4 w-4" /></Button>
                    <Button type="button" variant="ghost" disabled={pending || index === draft.menuOrder.length - 1} aria-label={`Move ${item.label} down`} onClick={() => move(id, 1)}><ArrowDown aria-hidden="true" className="h-4 w-4" /></Button>
                  </li>;
                })}
              </ol>
            </CardContent>
          </Card>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" disabled={pending || !dirty} onClick={save}>{pending ? "Saving…" : "Save preferences"}</Button>
            <Button type="button" variant="outline" disabled={pending || !dirty} onClick={() => change(saved)}>Cancel changes</Button>
            <Button type="button" variant="ghost" disabled={pending} onClick={() => change(defaultPersonalization)}><RotateCcw aria-hidden="true" className="h-4 w-4" />Reset to default</Button>
          </div>
          <p role="status" className="text-sm text-muted-foreground">{pending ? "Saving your preferences…" : message || (dirty ? "You have unsaved changes." : "Your workspace is up to date.")}</p>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        </div>
        <section aria-label="Workspace preview" className="rounded-xl border bg-card p-4 xl:sticky xl:top-6" style={themeStyle(draft.palette) as CSSProperties}>
          <p className="mb-4 text-xs font-medium uppercase tracking-widest text-muted-foreground">Live preview</p>
          <p className="mb-4 font-semibold">Your studio</p>
          <div className="space-y-1">{draft.menuOrder.map((id, index) => <div key={id} className={index === 0 ? "rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-foreground" : "px-3 py-2 text-sm text-muted-foreground"}>{menuItems.find(item => item.id === id)?.label}</div>)}</div>
          <div className="mt-5 rounded-md bg-primary px-3 py-2 text-center text-sm text-primary-foreground">Primary button</div>
          <p className="mt-4 text-xs text-muted-foreground">Save to apply this look across your workspace.</p>
        </section>
      </div>
    </div>
  );
}
