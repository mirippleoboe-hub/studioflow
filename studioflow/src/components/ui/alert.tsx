import * as React from "react";

import { cn } from "@/lib/utils";

export function Alert({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-md border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive", className)}
      role="alert"
      {...props}
    />
  );
}
