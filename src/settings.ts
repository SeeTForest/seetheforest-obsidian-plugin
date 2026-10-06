import type { FilterOptions } from "./graph";
export interface Settings extends FilterOptions {
  query: string;
  follow: boolean;
  exclusions: string[];
  groups: Array<{ query: string; color: string }>;
}
export const DEFAULTS: Settings = {
  query: "",
  tags: false,
  attachments: false,
  existingOnly: true,
  orphans: true,
  depth: 1,
  direction: "both",
  follow: true,
  exclusions: [],
  groups: [],
};
export function normalizeSettings(input: unknown): Settings {
  const source =
    input && typeof input === "object"
      ? (input as Record<string, unknown>)
      : {};
  const result = {
    ...DEFAULTS,
    exclusions: [] as string[],
    groups: [] as Settings["groups"],
  };
  for (const key of [
    "tags",
    "attachments",
    "existingOnly",
    "orphans",
    "follow",
  ] as const)
    if (typeof source[key] === "boolean") result[key] = source[key];
  if (typeof source.query === "string") result.query = source.query;
  if (typeof source.depth === "number" && Number.isFinite(source.depth))
    result.depth = Math.max(0, Math.min(20, Math.floor(source.depth)));
  if (["both", "incoming", "outgoing"].includes(String(source.direction)))
    result.direction = source.direction as Settings["direction"];
  if (Array.isArray(source.exclusions))
    result.exclusions = source.exclusions.filter(
      (x): x is string => typeof x === "string" && x.length > 0,
    );
  if (Array.isArray(source.groups))
    result.groups = source.groups.filter(
      (x: unknown): x is Settings["groups"][number] =>
        !!x && typeof x === "object" && "query" in x && "color" in x &&
        typeof x.query === "string" && typeof x.color === "string" && /^#[0-9a-f]{6}$/i.test(x.color),
    );
  return result;
}
