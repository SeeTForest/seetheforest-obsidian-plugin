/** Public structural input, not a renderer or a Markdown parser. */
export interface GraphNode {
  id: string;
  slug: string;
  title: string;
  domain: string;
  sections?: string[];
  tags: string[];
  mocs: string[];
  featured: boolean;
  isMoc: boolean;
  hasTopicMap: boolean;
  summary: string;
  structuralRole: "moc" | "core" | "bridge" | "regular";
  navigationReasons: string[];
  readingMinutes: number;
  incomingLinkCount: number;
  outgoingLinkCount: number;
}
export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  kind: "wiki" | "markdown";
  label: string;
}
export interface ContentGraph {
  schemaVersion: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  topicMaps: [];
}
export interface VaultEntry {
  path: string;
  title: string;
  markdown: boolean;
  tags: string[];
  properties: Record<string, unknown>;
  text?: string;
}
export interface Snapshot {
  files: VaultEntry[];
  resolved: Record<string, Record<string, number>>;
  unresolved: Record<string, Record<string, number>>;
  linkKinds?: Record<string, "wiki" | "markdown">;
}
export type Target =
  | { kind: "file"; path: string }
  | { kind: "unresolved"; link: string; source: string }
  | { kind: "tag"; tag: string };
export interface IndexedGraph {
  graph: ContentGraph;
  targets: Map<string, Target>;
  entries: Map<string, VaultEntry>;
  occurrences: Map<string, number>;
}

export class Identities {
  readonly paths: Record<string, string> = Object.create(null);
  constructor(
    saved: unknown = {},
    private makeId: () => string = () => crypto.randomUUID(),
  ) {
    const used = new Set<string>();
    if (saved && typeof saved === "object")
      for (const [path, id] of Object.entries(saved)) {
        if (
          typeof id === "string" &&
          /^note:[a-zA-Z0-9-]+$/.test(id) &&
          !used.has(id)
        ) {
          this.paths[path] = id;
          used.add(id);
        }
      }
  }
  get(path: string): string {
    return this.paths[path] ?? (this.paths[path] = `note:${this.makeId()}`);
  }
  rename(oldPath: string, newPath: string): void {
    for (const path of Object.keys(this.paths))
      if (path === oldPath || path.startsWith(`${oldPath}/`)) {
        const id = this.paths[path]!;
        delete this.paths[path];
        this.paths[newPath + path.slice(oldPath.length)] = id;
      }
  }
  remove(path: string): void {
    for (const key of Object.keys(this.paths))
      if (key === path || key.startsWith(`${path}/`)) delete this.paths[key];
  }
  reconcile(paths: Set<string>): void {
    for (const path of Object.keys(this.paths))
      if (!paths.has(path)) delete this.paths[path];
  }
}

export function buildGraph(snapshot: Snapshot, ids: Identities): IndexedGraph {
  const targets = new Map<string, Target>();
  const entries = new Map<string, VaultEntry>();
  const occurrences = new Map<string, number>();
  const nodes = new Map<string, GraphNode>();
  const edgeMap = new Map<string, GraphEdge>();
  const byPath = new Map(snapshot.files.map((file) => [file.path, file]));
  ids.reconcile(new Set(byPath.keys()));
  for (const file of snapshot.files) {
    const id = ids.get(file.path);
    targets.set(id, { kind: "file", path: file.path });
    entries.set(id, file);
    const parts = file.path.split("/");
    const isMoc = file.properties.type === "moc";
    nodes.set(
      id,
      node(id, file.title, {
        domain:
          typeof file.properties.domain === "string" &&
          file.properties.domain.trim()
            ? file.properties.domain
            : parts.length > 1
              ? parts[0]!
              : "未分类",
        sections: parts.slice(1, -1),
        tags: file.tags,
        isMoc,
        structuralRole: isMoc ? "moc" : "regular",
        featured: file.properties.featured === true,
      }),
    );
  }
  function addEdge(
    source: string,
    target: string,
    label: string,
    count: number,
  ) {
    const id = JSON.stringify([source, target]);
    const sourcePath = targets.get(source);
    const targetPath = targets.get(target);
    const kind =
      sourcePath?.kind === "file" && targetPath?.kind === "file"
        ? (snapshot.linkKinds?.[
            JSON.stringify([sourcePath.path, targetPath.path])
          ] ?? "wiki")
        : "wiki";
    edgeMap.set(id, { id, source, target, label, kind });
    occurrences.set(id, (occurrences.get(id) ?? 0) + count);
  }
  for (const file of snapshot.files) {
    if (!file.markdown) continue;
    const source = ids.get(file.path);
    for (const [path, count] of Object.entries(
      snapshot.resolved[file.path] ?? {},
    )) {
      if (byPath.has(path) && count > 0)
        addEdge(source, ids.get(path), "Obsidian 已解析链接", count);
    }
    for (const [link, count] of Object.entries(
      snapshot.unresolved[file.path] ?? {},
    )) {
      if (count <= 0) continue;
      // Source context is essential: two relative unresolved targets may differ.
      const id = `missing:${JSON.stringify([source, link])}`;
      targets.set(id, { kind: "unresolved", source: file.path, link });
      nodes.set(id, node(id, link, { domain: "未解析链接" }));
      addEdge(source, id, "未解析链接", count);
    }
    for (const tag of new Set(file.tags)) {
      const id = `tag:${tag}`;
      targets.set(id, { kind: "tag", tag });
      nodes.set(id, node(id, tag, { domain: "标签" }));
      addEdge(source, id, "标签归属", 1);
    }
  }
  const graph: ContentGraph = {
    schemaVersion: "obsidian-local-1",
    nodes: [...nodes.values()],
    edges: [...edgeMap.values()],
    topicMaps: [],
  };
  countRelations(graph);
  return { graph, targets, entries, occurrences };
}

function node(
  id: string,
  title: string,
  extra: Partial<GraphNode> = {},
): GraphNode {
  return {
    id,
    slug: id,
    title,
    domain: "未分类",
    tags: [],
    mocs: [],
    featured: false,
    isMoc: false,
    hasTopicMap: false,
    summary: "",
    structuralRole: "regular",
    navigationReasons: [],
    readingMinutes: 0,
    incomingLinkCount: 0,
    outgoingLinkCount: 0,
    ...extra,
  };
}

function countRelations(graph: ContentGraph): void {
  const incoming = new Map<string, Set<string>>(),
    outgoing = new Map<string, Set<string>>();
  for (const edge of graph.edges) {
    if (!incoming.has(edge.target)) incoming.set(edge.target, new Set());
    if (!outgoing.has(edge.source)) outgoing.set(edge.source, new Set());
    incoming.get(edge.target)!.add(edge.source);
    outgoing.get(edge.source)!.add(edge.target);
  }
  for (const n of graph.nodes) {
    n.incomingLinkCount = incoming.get(n.id)?.size ?? 0;
    n.outgoingLinkCount = outgoing.get(n.id)?.size ?? 0;
  }
}

export interface FilterOptions {
  tags: boolean;
  attachments: boolean;
  existingOnly: boolean;
  orphans: boolean;
  depth: number;
  direction: "both" | "incoming" | "outgoing";
}
export function projectGraph(
  index: IndexedGraph,
  options: FilterOptions,
  matches: (entry: VaultEntry) => boolean,
  centerId?: string,
): ContentGraph {
  let nodes = index.graph.nodes.filter((n) => {
    const target = index.targets.get(n.id)!;
    if (target.kind === "tag") return options.tags;
    if (target.kind === "unresolved") return !options.existingOnly;
    const entry = index.entries.get(n.id)!;
    return (entry.markdown || options.attachments) && matches(entry);
  });
  let allowed = new Set(nodes.map((n) => n.id));
  let edges = index.graph.edges.filter(
    (e) => allowed.has(e.source) && allowed.has(e.target),
  );
  if (centerId !== undefined) {
    const adjacent = new Map<string, Set<string>>();
    const add = (a: string, b: string) => {
      if (!adjacent.has(a)) adjacent.set(a, new Set());
      adjacent.get(a)!.add(b);
    };
    for (const e of edges) {
      if (options.direction !== "incoming") add(e.source, e.target);
      if (options.direction !== "outgoing") add(e.target, e.source);
    }
    const found = new Set(allowed.has(centerId) ? [centerId] : []);
    let frontier = [...found];
    for (let depth = 0; depth < options.depth && frontier.length; depth++) {
      const next: string[] = [];
      for (const id of frontier)
        for (const neighbor of adjacent.get(id) ?? [])
          if (!found.has(neighbor)) {
            found.add(neighbor);
            next.push(neighbor);
          }
      frontier = next;
    }
    allowed = found;
    nodes = nodes.filter((n) => allowed.has(n.id));
    edges = edges.filter((e) => allowed.has(e.source) && allowed.has(e.target));
  }
  if (!options.orphans) {
    const linked = new Set(edges.flatMap((e) => [e.source, e.target]));
    nodes = nodes.filter((n) => linked.has(n.id));
  }
  const graph: ContentGraph = {
    schemaVersion: index.graph.schemaVersion,
    nodes: nodes.map((n) => ({ ...n })),
    edges,
    topicMaps: [],
  };
  countRelations(graph);
  return graph;
}
