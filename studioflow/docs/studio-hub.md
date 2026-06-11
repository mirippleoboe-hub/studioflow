# Studio Hub

The Studio Hub is the shared `/resources` page for a studio. It behaves like a lightweight Notion-style page builder.

## Teacher Builder

Teachers edit the hub at `/resources/edit`.

Supported block types:

- Heading
- Text
- Callout
- Checklist
- Link
- Divider

Teachers can add, reorder, edit, delete, preview, and publish blocks. Draft hubs are visible to teachers only.

## Student View

Students view the published hub at `/resources`.

If the teacher has not published the hub, students see an unpublished state instead of draft content.

## Data Model

Each studio has one `studio_hub_pages` row. Blocks are stored as ordered JSONB so the builder can evolve without a migration for every new block type. RLS allows teachers to read drafts and students to read only published pages.
