import type { Route } from "next";

export function safeNextPath(value: unknown): Route {
  if (typeof value !== "string" || !value.startsWith("/") ||
      value.startsWith("//") || /[\\\x00-\x20]/.test(value)) return "/dashboard";
  const url = new URL(value, "https://studioflow.invalid");
  if (url.origin !== "https://studioflow.invalid") return "/dashboard";
  return `${url.pathname}${url.search}${url.hash}` as Route;
}
