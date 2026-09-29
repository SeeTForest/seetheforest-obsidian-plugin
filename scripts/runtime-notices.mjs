import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
// This exact npm release omits LICENSE.md. Keep the pinned upstream notice,
// not a generic MIT template or a silent exemption for future versions.
const missingNotices = {
  "@pixi/colord@2.9.6": {
    license: "MIT",
    file: "licenses/pixi-colord-2.9.6.txt",
    source:
      "https://raw.githubusercontent.com/pixijs/colord/5344fbf77b736f81cd33c21050021bc09bc9dd1d/LICENSE.md",
  },
};
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
    notices.push(`\n${pkg.name}@${pkg.version}\n`);
    if (!licenses.length) {
      const pinned = missingNotices[`${pkg.name}@${pkg.version}`];
      if (!pinned || pkg.license !== pinned.license)
        throw Error(`Missing bundled dependency license: ${pkg.name}`);
      notices.push(`Upstream notice: ${pinned.source}\n`);
      notices.push(
        await readFile(new URL(pinned.file, import.meta.url), "utf8"),
      );
    }
    for (const name of licenses)
      notices.push(await readFile(path.resolve(root, dir, name), "utf8"));
  }
  return notices.join("\n");
}
