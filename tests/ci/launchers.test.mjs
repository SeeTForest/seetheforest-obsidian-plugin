import { test } from "node:test";
import assert from "node:assert/strict";
import { copyFile, mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));

test("native launcher locates the shared runner, forwards arguments and preserves failure", async () => {
  // Synthetic runner only: do not recursively start CI or touch protected inputs.
  const fixture = await mkdtemp(path.join(tmpdir(), "stf-launcher-"));
  const scripts = path.join(fixture, "space directory");
  await mkdir(scripts);
  const name = process.platform === "win32" ? "ci.bat" : "ci.sh";
  const launcher = path.join(scripts, name);
  await copyFile(path.join(root, "scripts", name), launcher);
  await writeFile(path.join(scripts, "ci.mjs"),
    "console.log(JSON.stringify(process.argv.slice(2))); process.exitCode = 23;\n");
  const command = process.platform === "win32" ? (process.env.ComSpec ?? "cmd.exe") : "sh";
  const args = process.platform === "win32"
    ? ["/d", "/s", "/c", `""${launcher}" source "two words""`]
    : [launcher, "source", "two words"];
  const pathKey = Object.keys(process.env).find((key) => key.toLowerCase() === "path") ?? "PATH";
  assert.throws(() => execFileSync(command, args, {
    cwd: tmpdir(), encoding: "utf8", stdio: "pipe", windowsHide: true,
    windowsVerbatimArguments: process.platform === "win32",
    env: { ...process.env, [pathKey]: path.dirname(process.execPath) + path.delimiter + (process.env[pathKey] ?? "") },
  }), (error) => {
    assert.equal(error.status, 23);
    assert.deepEqual(JSON.parse(error.stdout.trim()), ["source", "two words"]);
    return true;
  });
});

test("shell launcher uses portable LF and workflows only invoke local entrypoints", async () => {
  const shell = await readFile(path.join(root, "scripts/ci.sh"), "utf8");
  assert.ok(shell.startsWith("#!/bin/sh\n"));
  assert.ok(!shell.includes("\r"));
  const expected = {
    "source-ci.yml": ["npm run ci:source"],
    "protected-ci.yml": ["node scripts/fetch-atlas.mjs", "npm run ci:full"],
  };
  for (const [name, calls] of Object.entries(expected)) {
    const yaml = await readFile(path.join(root, ".github/workflows", name), "utf8");
    assert.deepEqual([...yaml.matchAll(/^\s+run: (.+)$/gm)].map((match) => match[1].trim()), calls,
      "Keep repeated checks and build logic in local scripts, not inline YAML");
  }
});
