import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
/** Derive the exact bundled dependency set from esbuild, not a guessed list. */
export async function runtimeNotices(root, metafiles) {
  const directories = new Set();
  for (const meta of metafiles)
    for (const name of Object.keys(meta.inputs)) {
      const match = name
        .replaceAll("\\", "/")
        .match(/^(.*node_modules\/(?:@[^/]+\/)?[^/]+)\//);
      if (match) directories.add(match[1]);
    }
  const notices = [
    "Third-party runtime notices. Atlas proprietary terms are in ATLAS-LICENSE.txt.",
  ];
  for (const dir of [...directories].sort()) {
    const pkg = JSON.parse(
      await readFile(path.resolve(root, dir, "package.json"), "utf8"),
    );
    if (pkg.name === "@seetheforest/atlas") continue;
    const files = await readdir(path.resolve(root, dir));
    const licenses = files.filter((name) =>
      /^(licen[sc]e|notice)(?:\.[a-z]+)?$/i.test(name),
    );
    if (!licenses.length)
      throw Error(`Missing bundled dependency license: ${pkg.name}`);
    notices.push(`\n${pkg.name}@${pkg.version}\n`);
    for (const name of licenses)
      notices.push(await readFile(path.resolve(root, dir, name), "utf8"));
  }
  return notices.join("\n");
}
