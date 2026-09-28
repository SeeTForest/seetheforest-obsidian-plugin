import { build } from "esbuild";
import {
  mkdir,
  readFile,
  writeFile,
  copyFile,
  readdir,
} from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { verifyAtlas, hash } from "./atlas-verification.mjs";
import { runtimeNotices } from "./runtime-notices.mjs";
const root = fileURLToPath(new URL("../", import.meta.url));
const lock = JSON.parse(
  await readFile(path.join(root, "vendor/atlas.lock.json"), "utf8"),
);
const verified = await verifyAtlas(
  ...["atlas.tgz", "atlas.sig", "atlas-public.pem"].map((name) =>
    path.join(root, "vendor", name),
  ),
  lock,
);
const types = verified.read("types/solid.d.ts").toString();
if (
  !types.includes("ATLAS_HOST_API_VERSION") ||
  !types.includes("runtimeAssets?:") ||
  !types.includes("host?:")
)
  throw Error(
    "Atlas signed baseline has no native host API v1. A reviewed, signed upstream release is required; refusing an unusable plugin package.",
  );
// Check that bundling consumes exactly the independently verified package.
for (const [name, digest] of Object.entries(verified.protection.files)) {
  if (
    hash(
      await readFile(path.join(root, "node_modules/@seetheforest/atlas", name)),
    ) !== digest
  )
    throw Error("Installed Atlas differs from verified release");
}
const dist = path.join(root, "dist/seetheforest-atlas");
await mkdir(path.join(dist, "assets"), { recursive: true });
const assets = Object.keys(verified.protection.files).filter((name) =>
  name.startsWith("assets/"),
);
const worker = assets.filter((name) => name.endsWith(".js"));
const wasm = assets.filter((name) => name.endsWith(".wasm"));
if (worker.length !== 1 || wasm.length !== 1)
  throw Error(
    "Runtime asset contract requires exactly one Worker and one Wasm",
  );
for (const name of assets)
  await writeFile(path.join(dist, name), verified.read(name));
const layoutBuild = await build({
  metafile: true,
  absWorkingDir: root,
  entryPoints: ["src/layout.worker.ts"],
  outfile: path.join(dist, "assets/layout.js"),
  bundle: true,
  platform: "browser",
  format: "iife",
  target: "es2022",
  conditions: ["browser"],
  sourcemap: false,
  minify: true,
  legalComments: "none",
});
assets.push("assets/layout.js");
const mainBuild = await build({
  metafile: true,
  absWorkingDir: root,
  entryPoints: ["src/main.ts"],
  outfile: path.join(dist, "main.js"),
  bundle: true,
  platform: "browser",
  format: "cjs",
  target: "es2022",
  conditions: ["browser"],
  external: ["obsidian"],
  sourcemap: false,
  minify: true,
  legalComments: "none",
  define: {
    __ATLAS_ASSETS__: JSON.stringify({
      worker: worker[0],
      wasm: wasm[0],
      layout: "assets/layout.js",
    }),
  },
  loader: { ".css": "empty" },
});
await copyFile(
  path.join(root, "manifest.json"),
  path.join(dist, "manifest.json"),
);
await writeFile(
  path.join(dist, "styles.css"),
  verified.read("styles.css").toString() +
    "\n" +
    (await readFile(path.join(root, "styles.css"), "utf8")),
);
await writeFile(path.join(dist, "ATLAS-LICENSE.txt"), verified.read("LICENSE"));
await writeFile(
  path.join(dist, "THIRD-PARTY-NOTICES.txt"),
  await runtimeNotices(root, [layoutBuild.metafile, mainBuild.metafile]),
);
const files = [
  "main.js",
  "manifest.json",
  "styles.css",
  "ATLAS-LICENSE.txt",
  "THIRD-PARTY-NOTICES.txt",
  ...assets,
];
// An existing output is never silently accepted if it has extra files.
const actual = (await readdir(dist, { recursive: true, withFileTypes: true }))
  .filter((x) => x.isFile())
  .map((x) =>
    path.relative(dist, path.join(x.parentPath, x.name)).replaceAll("\\", "/"),
  );
if (actual.some((name) => !files.includes(name) && name !== "integrity.json"))
  throw Error(
    "Unexpected file in package directory; inspect output before packaging",
  );
await writeFile(
  path.join(dist, "integrity.json"),
  JSON.stringify(
    {
      version: JSON.parse(
        await readFile(path.join(root, "manifest.json"), "utf8"),
      ).version,
      atlas: { version: lock.version, sha256: lock.sha256 },
      files: Object.fromEntries(
        await Promise.all(
          files.map(async (name) => [
            name,
            hash(await readFile(path.join(dist, name))),
          ]),
        ),
      ),
    },
    null,
    2,
  ),
);
console.log(
  "Built dist/seetheforest-atlas. Run verify:package before installation.",
);
