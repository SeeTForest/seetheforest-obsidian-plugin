import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeBuildText } from "../../scripts/build-text.mjs";

test("build text is identical for LF, CRLF and CR checkouts without changing content", () => {
  for (const text of [
    "MIT License\nCopyright (c) 2026 See the Forest\n",
    '{\n  "id": "seetheforest-atlas",\n  "version": "0.1.1"\n}\n',
    ".stf-panel {\n  color: inherit;\n}\n/* 星图 */\n",
  ]) {
    for (const newline of ["\n", "\r\n", "\r"]) {
      const normalized = normalizeBuildText(text.replaceAll("\n", newline));
      assert.equal(normalized, text);
      assert.equal(normalizeBuildText(normalized), text);
    }
  }
});
