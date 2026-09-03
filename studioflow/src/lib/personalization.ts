export const menuItems = [
  { id: "dashboard", label: "Dashboard", href: "/dashboard" },
  { id: "students", label: "Students", href: "/students" },
  { id: "lessons", label: "Lessons", href: "/lessons" },
  { id: "assignments", label: "Assignments", href: "/assignments" },
  { id: "resources", label: "Studio Hub", href: "/resources" },
  { id: "calendar", label: "Calendar", href: "/calendar" },
  { id: "settings", label: "Settings", href: "/settings" }
] as const;
export type MenuId = typeof menuItems[number]["id"];
export const palettes = {
  charcoal: { name: "Charcoal", primary: "240 5% 18%", accent: "240 5% 94%" },
  ocean: { name: "Ocean", primary: "212 65% 34%", accent: "212 65% 94%" },
  forest: { name: "Forest", primary: "155 43% 28%", accent: "155 35% 94%" },
  plum: { name: "Plum", primary: "275 38% 36%", accent: "275 38% 95%" },
  clay: { name: "Clay", primary: "15 55% 36%", accent: "15 55% 95%" }
} as const;
export type Palette = keyof typeof palettes;
export type Personalization = { palette: Palette; menuOrder: MenuId[] };
export const defaultPersonalization: Personalization = { palette: "charcoal", menuOrder: menuItems.map(item => item.id) };

// Metadata is user-editable: accept only known colors and menu identifiers.
export function normalizePersonalization(value: unknown): Personalization {
  const input = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const palette = typeof input.palette === "string" && Object.hasOwn(palettes, input.palette) ? input.palette as Palette : "charcoal";
  const order = Array.isArray(input.menuOrder) ? input.menuOrder : [];
  const menuOrder = [...new Set(order.filter((id): id is MenuId => menuItems.some(item => item.id === id)))];
  for (const item of menuItems) if (!menuOrder.includes(item.id)) menuOrder.push(item.id);
  return { palette, menuOrder };
}
export function themeStyle(palette: Palette) {
  const color = palettes[palette];
  return { "--primary": color.primary, "--primary-foreground": "0 0% 100%", "--ring": color.primary, "--accent": color.accent, "--accent-foreground": color.primary };
}
