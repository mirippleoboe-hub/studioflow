import type { Json } from "@/lib/database.types";

export type StudioHubBlockType = "heading" | "text" | "callout" | "checklist" | "link" | "divider";

export type StudioHubBlock = {
  id: string;
  type: StudioHubBlockType;
  content: string;
  href?: string;
  checked?: boolean;
};

const blockTypes = new Set<StudioHubBlockType>(["heading", "text", "callout", "checklist", "link", "divider"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

export function parseStudioHubBlocks(value: Json | string | null | undefined): StudioHubBlock[] {
  let parsed: unknown = value;

  if (typeof value === "string") {
    try {
      parsed = JSON.parse(value);
    } catch {
      return [];
    }
  }

  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed
    .filter(isRecord)
    .map((block, index) => {
      const type = blockTypes.has(block.type as StudioHubBlockType) ? (block.type as StudioHubBlockType) : "text";

      return {
        id: asString(block.id) || `block-${index}`,
        type,
        content: asString(block.content),
        href: asString(block.href),
        checked: block.checked === true
      };
    });
}

export function defaultStudioHubBlocks(): StudioHubBlock[] {
  return [
    {
      id: "welcome",
      type: "heading",
      content: "Welcome to the studio"
    },
    {
      id: "intro",
      type: "text",
      content: "Use this hub for announcements, practice expectations, links, and shared studio resources."
    },
    {
      id: "practice",
      type: "callout",
      content: "Practice slowly, listen carefully, and write down questions before your next lesson."
    }
  ];
}
