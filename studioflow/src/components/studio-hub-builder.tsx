"use client";

import { useMemo, useState } from "react";
import type { ComponentType } from "react";
import { ArrowDown, ArrowUp, Heading, Info, Link2, ListChecks, Minus, Save, Trash2, Type } from "lucide-react";

import { StudioHubRenderer } from "@/components/studio-hub-renderer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { StudioHubBlock, StudioHubBlockType } from "@/lib/studio-hub";
import { cn } from "@/lib/utils";

type StudioHubBuilderProps = {
  action: (formData: FormData) => void;
  initialBlocks: StudioHubBlock[];
  initialPublished: boolean;
  initialTitle: string;
};

type BlockOption = {
  type: StudioHubBlockType;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

const blockOptions: BlockOption[] = [
  { type: "heading", label: "Heading", icon: Heading },
  { type: "text", label: "Text", icon: Type },
  { type: "callout", label: "Callout", icon: Info },
  { type: "checklist", label: "Checklist", icon: ListChecks },
  { type: "link", label: "Link", icon: Link2 },
  { type: "divider", label: "Divider", icon: Minus }
];

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `block-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function newBlock(type: StudioHubBlockType): StudioHubBlock {
  if (type === "heading") {
    return { id: createId(), type, content: "New section" };
  }

  if (type === "callout") {
    return { id: createId(), type, content: "Helpful reminder for students." };
  }

  if (type === "checklist") {
    return { id: createId(), type, content: "New checklist item", checked: false };
  }

  if (type === "link") {
    return { id: createId(), type, content: "Resource link", href: "" };
  }

  if (type === "divider") {
    return { id: createId(), type, content: "" };
  }

  return { id: createId(), type, content: "Write something..." };
}

export function StudioHubBuilder({ action, initialBlocks, initialPublished, initialTitle }: StudioHubBuilderProps) {
  const [title, setTitle] = useState(initialTitle);
  const [isPublished, setIsPublished] = useState(initialPublished);
  const [blocks, setBlocks] = useState<StudioHubBlock[]>(initialBlocks);
  const serializedBlocks = useMemo(() => JSON.stringify(blocks), [blocks]);

  function addBlock(type: StudioHubBlockType) {
    setBlocks((current) => [...current, newBlock(type)]);
  }

  function updateBlock(id: string, patch: Partial<StudioHubBlock>) {
    setBlocks((current) => current.map((block) => (block.id === id ? { ...block, ...patch } : block)));
  }

  function removeBlock(id: string) {
    setBlocks((current) => current.filter((block) => block.id !== id));
  }

  function moveBlock(id: string, direction: -1 | 1) {
    setBlocks((current) => {
      const index = current.findIndex((block) => block.id === id);
      const nextIndex = index + direction;

      if (index < 0 || nextIndex < 0 || nextIndex >= current.length) {
        return current;
      }

      const next = [...current];
      const [block] = next.splice(index, 1);
      next.splice(nextIndex, 0, block);
      return next;
    });
  }

  return (
    <form action={action} className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
      <input name="blocks" type="hidden" value={serializedBlocks} />

      <div className="space-y-5">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Page settings</CardTitle>
            <CardDescription>Control the hub title and student visibility.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Hub title</Label>
              <Input id="title" name="title" value={title} onChange={(event) => setTitle(event.target.value)} required />
            </div>
            <Label className="flex cursor-pointer items-center gap-3 rounded-md border bg-background p-3">
              <input
                checked={isPublished}
                className="h-4 w-4 accent-primary"
                name="is_published"
                onChange={(event) => setIsPublished(event.target.checked)}
                type="checkbox"
              />
              Publish to students
            </Label>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Blocks</CardTitle>
            <CardDescription>Add and arrange hub content blocks.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {blockOptions.map((option) => {
                const Icon = option.icon;

                return (
                  <Button key={option.type} onClick={() => addBlock(option.type)} type="button" variant="outline">
                    <Icon className="h-4 w-4" />
                    {option.label}
                  </Button>
                );
              })}
            </div>

            <div className="space-y-3">
              {blocks.length === 0 ? (
                <div className="rounded-md border border-dashed bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
                  Add a block to start building the hub.
                </div>
              ) : null}

              {blocks.map((block, index) => (
                <BlockEditor
                  block={block}
                  index={index}
                  key={block.id}
                  onMove={moveBlock}
                  onRemove={removeBlock}
                  onUpdate={updateBlock}
                  total={blocks.length}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-5">
        <Button className="w-full" type="submit">
          <Save className="h-4 w-4" />
          Save hub
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{title || "Studio Hub"}</CardTitle>
            <CardDescription>{isPublished ? "Published student view" : "Draft teacher preview"}</CardDescription>
          </CardHeader>
          <CardContent>
            <StudioHubRenderer blocks={blocks} />
          </CardContent>
        </Card>
      </div>
    </form>
  );
}

type BlockEditorProps = {
  block: StudioHubBlock;
  index: number;
  onMove: (id: string, direction: -1 | 1) => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, patch: Partial<StudioHubBlock>) => void;
  total: number;
};

function BlockEditor({ block, index, onMove, onRemove, onUpdate, total }: BlockEditorProps) {
  return (
    <div className="rounded-md border bg-background p-3">
      <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <select
            className="h-9 rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onChange={(event) => onUpdate(block.id, { type: event.target.value as StudioHubBlockType })}
            value={block.type}
          >
            {blockOptions.map((option) => (
              <option key={option.type} value={option.type}>
                {option.label}
              </option>
            ))}
          </select>
          <span className="text-xs text-muted-foreground">Block {index + 1}</span>
        </div>
        <div className="flex gap-2">
          <Button aria-label="Move block up" disabled={index === 0} onClick={() => onMove(block.id, -1)} size="icon" type="button" variant="outline">
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Button
            aria-label="Move block down"
            disabled={index === total - 1}
            onClick={() => onMove(block.id, 1)}
            size="icon"
            type="button"
            variant="outline"
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
          <Button aria-label="Delete block" onClick={() => onRemove(block.id)} size="icon" type="button" variant="destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {block.type === "divider" ? (
        <div className="rounded-md border border-dashed px-3 py-4 text-center text-xs text-muted-foreground">Divider</div>
      ) : (
        <div className="space-y-3">
          {block.type === "link" ? (
            <div className="space-y-2">
              <Label>URL</Label>
              <Input onChange={(event) => onUpdate(block.id, { href: event.target.value })} placeholder="https://example.com" value={block.href ?? ""} />
            </div>
          ) : null}

          {block.type === "checklist" ? (
            <Label className="flex cursor-pointer items-center gap-3">
              <input
                checked={block.checked === true}
                className="h-4 w-4 accent-primary"
                onChange={(event) => onUpdate(block.id, { checked: event.target.checked })}
                type="checkbox"
              />
              Checked
            </Label>
          ) : null}

          <div className="space-y-2">
            <Label>{block.type === "link" ? "Label" : "Content"}</Label>
            <Textarea
              className={cn(block.type === "heading" && "min-h-16 text-lg font-semibold")}
              onChange={(event) => onUpdate(block.id, { content: event.target.value })}
              value={block.content}
            />
          </div>
        </div>
      )}
    </div>
  );
}
