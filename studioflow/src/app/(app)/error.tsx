"use client";
import { Button } from "@/components/ui/button";
export default function WorkspaceError({reset}:{reset:()=>void}){return <div className="space-y-4 rounded-xl border bg-card p-8"><h1 className="text-xl font-semibold">We could not load this page</h1><p className="text-sm text-muted-foreground">Please try again. Your saved studio information is still there.</p><Button onClick={reset}>Try again</Button></div>;}
