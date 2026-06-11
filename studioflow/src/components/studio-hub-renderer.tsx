import { CheckSquare, ExternalLink, Info, Square } from "lucide-react";

import type { StudioHubBlock } from "@/lib/studio-hub";

type StudioHubRendererProps = {
  blocks: StudioHubBlock[];
  emptyMessage?: string;
};

function safeHref(value: string | undefined) {
  if (!value) {
    return "";
  }

  return value.startsWith("http://") || value.startsWith("https://") ? value : `https://${value}`;
}

export function StudioHubRenderer({ blocks, emptyMessage = "This hub is empty." }: StudioHubRendererProps) {
  if (blocks.length === 0) {
    return <div className="rounded-md border border-dashed bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground">{emptyMessage}</div>;
  }

  return (
    <div className="space-y-4">
      {blocks.map((block) => {
        if (block.type === "divider") {
          return <hr className="border-border" key={block.id} />;
        }

        if (block.type === "heading") {
          return (
            <h2 className="text-xl font-semibold tracking-normal" key={block.id}>
              {block.content || "Untitled heading"}
            </h2>
          );
        }

        if (block.type === "callout") {
          return (
            <div className="flex gap-3 rounded-md border bg-accent/50 p-4 text-sm" key={block.id}>
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-accent-foreground" />
              <p className="whitespace-pre-wrap leading-6">{block.content || "Callout"}</p>
            </div>
          );
        }

        if (block.type === "checklist") {
          const Icon = block.checked ? CheckSquare : Square;

          return (
            <div className="flex gap-3 rounded-md border bg-background p-3 text-sm" key={block.id}>
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p className="whitespace-pre-wrap leading-6">{block.content || "Checklist item"}</p>
            </div>
          );
        }

        if (block.type === "link") {
          const href = safeHref(block.href);

          return href ? (
            <a
              className="inline-flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-accent"
              href={href}
              key={block.id}
              rel="noreferrer"
              target="_blank"
            >
              {block.content || href}
              <ExternalLink className="h-4 w-4" />
            </a>
          ) : (
            <p className="text-sm text-muted-foreground" key={block.id}>
              Link block missing a URL.
            </p>
          );
        }

        return (
          <p className="whitespace-pre-wrap text-sm leading-7" key={block.id}>
            {block.content || "Text block"}
          </p>
        );
      })}
    </div>
  );
}
