import { DEFAULTS, normalizeSettings, type Settings } from "./settings";

const OPTION_KEYS = [
  "query",
  "tags",
  "attachments",
  "existingOnly",
  "orphans",
  "depth",
  "direction",
  "follow",
] as const;
export type ViewOptions = Pick<Settings, (typeof OPTION_KEYS)[number]>;
export interface GraphViewState {
  local: boolean;
  centerPath: string;
  options: ViewOptions;
}

/** Workspace state contains view preferences, never note bodies or graph data. */
export function normalizeViewOptions(
  input: unknown,
  defaults: ViewOptions = DEFAULTS,
): ViewOptions {
  const source =
    input && typeof input === "object"
      ? (input as Record<string, unknown>)
      : {};
  const validDefaults = normalizeSettings(defaults);
  const values: Record<string, unknown> = {};
  for (const key of OPTION_KEYS) {
    const value = source[key];
    const valid =
      key === "depth"
        ? typeof value === "number" && Number.isFinite(value)
        : key === "direction"
          ? value === "both" || value === "incoming" || value === "outgoing"
          : typeof value === typeof validDefaults[key];
    values[key] =
      Object.hasOwn(source, key) && valid ? value : validDefaults[key];
  }
  const normalized = normalizeSettings(values);
  return {
    query: normalized.query,
    tags: normalized.tags,
    attachments: normalized.attachments,
    existingOnly: normalized.existingOnly,
    orphans: normalized.orphans,
    depth: normalized.depth,
    direction: normalized.direction,
    follow: normalized.follow,
  };
}

export function restoreViewState(
  input: unknown,
  defaults: ViewOptions = DEFAULTS,
): GraphViewState {
  const source =
    input && typeof input === "object"
      ? (input as Record<string, unknown>)
      : {};
  return {
    local: source.local === true,
    centerPath: typeof source.centerPath === "string" ? source.centerPath : "",
    // Older workspaces had only local/centerPath and shared plugin settings.
    options: normalizeViewOptions(source.options, defaults),
  };
}
